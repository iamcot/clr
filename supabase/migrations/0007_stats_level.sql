alter table members
  add column level int not null default 1 check (level >= 1),
  add column club_points int not null default 0,
  add column level_updated_at timestamptz;

-- Thêm level, club_points, level_updated_at vào nhóm cột chỉ BCN hoặc service role được sửa.
create or replace function members_guard_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null or is_bcn() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.strava_athlete_id is distinct from old.strava_athlete_id
    or new.role is distinct from old.role
    or new.member_type is distinct from old.member_type
    or new.status is distinct from old.status
    or new.member_code is distinct from old.member_code
    or new.strava_connected is distinct from old.strava_connected
    or new.joined_at is distinct from old.joined_at
    or new.avatar_url is distinct from old.avatar_url
    or new.rejection_reason is distinct from old.rejection_reason
    or new.level is distinct from old.level
    or new.club_points is distinct from old.club_points
    or new.level_updated_at is distinct from old.level_updated_at
  then
    raise exception 'Không có quyền sửa cột này' using errcode = '42501';
  end if;

  return new;
end;
$$;

create table member_stats_period (
  member_id uuid not null references members (id) on delete cascade,
  period_type text not null check (period_type in ('week', 'month', 'year', 'all')),
  period_start date not null,
  activity_count int not null,
  distance_m bigint not null,
  moving_time_s bigint not null,
  elevation_gain_m numeric not null,
  longest_m int not null,
  active_days int not null,
  updated_at timestamptz not null default now(),
  primary key (member_id, period_type, period_start)
);

alter table member_stats_period enable row level security;

create policy member_stats_select_own_or_bcn on member_stats_period
  for select
  to authenticated
  using (member_id = (select auth.uid()) or is_bcn());

-- Ghi member_stats_period: chỉ qua các hàm security definer bên dưới.

-- Tính lại mọi kỳ của một thành viên. Kỳ 'all' dùng period_start cố định 1970-01-01.
-- Tuần bắt đầu thứ Hai theo giờ Việt Nam (date_trunc('week') mặc định bắt đầu thứ Hai).
create function refresh_member_stats(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from member_stats_period where member_id = p_member_id;

  insert into member_stats_period (
    member_id, period_type, period_start, activity_count, distance_m, moving_time_s,
    elevation_gain_m, longest_m, active_days
  )
  with eligible as (
    select a.distance_m, a.moving_time_s, a.elevation_gain_m,
      (a.start_date at time zone 'Asia/Ho_Chi_Minh') as local_start
    from activities a
    join members m on m.id = a.member_id
    where a.member_id = p_member_id
      and a.counts_for_club
      and (m.share_private_in_totals or not (a.private or a.visibility = 'only_me'))
  ),
  bucketed as (
    select 'week' as period_type, date_trunc('week', local_start)::date as period_start, * from eligible
    union all
    select 'month', date_trunc('month', local_start)::date, * from eligible
    union all
    select 'year', date_trunc('year', local_start)::date, * from eligible
    union all
    select 'all', date '1970-01-01', * from eligible
  )
  select p_member_id, period_type, period_start, count(*), sum(distance_m), sum(moving_time_s),
    sum(elevation_gain_m), max(distance_m), count(distinct local_start::date)
  from bucketed
  group by period_type, period_start;
end;
$$;

create function refresh_all_member_stats()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  refreshed int := 0;
begin
  for target_id in select id from members where status = 'active' loop
    perform refresh_member_stats(target_id);
    refreshed := refreshed + 1;
  end loop;
  return refreshed;
end;
$$;

revoke execute on function refresh_member_stats(uuid) from public, anon, authenticated;
revoke execute on function refresh_all_member_stats() from public, anon, authenticated;
grant execute on function refresh_member_stats(uuid) to service_role;
grant execute on function refresh_all_member_stats() to service_role;

-- BCN đánh dấu hoạt động không hợp lệ thì tổng hợp của người đó đổi ngay.
create or replace function set_activity_flag(p_activity_id bigint, p_flagged boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row activities%rowtype;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  select * into current_row
  from activities
  where id = p_activity_id and not private and visibility <> 'only_me';
  if not found then
    raise exception 'Không tìm thấy hoạt động';
  end if;

  update activities
  set flagged_invalid = p_flagged,
      invalid_reason = case when p_flagged then p_reason else null end
  where id = p_activity_id;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (
    auth.uid(),
    'flag_activity',
    'activities',
    p_activity_id::text,
    jsonb_build_object('flagged_invalid', current_row.flagged_invalid, 'invalid_reason', current_row.invalid_reason),
    jsonb_build_object('flagged_invalid', p_flagged, 'invalid_reason', p_reason)
  );

  perform refresh_member_stats(current_row.member_id);
end;
$$;

-- Đổi tuỳ chọn cộng hoạt động riêng tư vào tổng thì tính lại ngay.
create function members_refresh_stats_on_private_toggle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform refresh_member_stats(new.id);
  return new;
end;
$$;

create trigger members_refresh_stats_on_private_toggle
  after update of share_private_in_totals on members
  for each row
  when (old.share_private_in_totals is distinct from new.share_private_in_totals)
  execute function members_refresh_stats_on_private_toggle();

-- Bảng xếp hạng CLB: chỉ người đã bật chia sẻ, và chỉ khi CLB đang để chế độ full_opt_in.
create view club_rankings as
  select m.id as member_id, m.display_name, m.avatar_url, m.member_type, m.gender, m.level, m.club_points,
    coalesce(month_stats.distance_m, 0) as month_distance_m,
    coalesce(year_stats.distance_m, 0) as year_distance_m
  from members m
  left join member_stats_period month_stats
    on month_stats.member_id = m.id and month_stats.period_type = 'month'
    and month_stats.period_start = date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh')::date
  left join member_stats_period year_stats
    on year_stats.member_id = m.id and year_stats.period_type = 'year'
    and year_stats.period_start = date_trunc('year', now() at time zone 'Asia/Ho_Chi_Minh')::date
  where m.status = 'active'
    and m.share_stats_with_club
    and exists (select 1 from settings where key = 'club_display_mode' and value = '"full_opt_in"'::jsonb);

revoke all on club_rankings from anon;
grant select on club_rankings to authenticated;

-- Điền sẵn bảng tổng hợp cho dữ liệu đã có; level được tính ở job đêm hoặc nút ở /admin/stats.
select refresh_all_member_stats();
