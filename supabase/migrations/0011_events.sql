create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  kind text not null default 'group_run' check (kind in ('group_run', 'race', 'social', 'charity', 'other')),
  description_md text not null default '',
  cover_url text,
  location_name text not null default '',
  location_lat double precision check (location_lat between -90 and 90),
  location_lng double precision check (location_lng between -180 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- null là đóng đăng ký lúc bắt đầu event
  registration_closes_at timestamptz,
  capacity int check (capacity > 0),
  fee bigint check (fee >= 0),
  route_distance_m int check (route_distance_m > 0),
  race_id uuid references races (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'done')),
  absent_penalty boolean not null default false,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((location_lat is null) = (location_lng is null))
);

create index events_starts_idx on events (starts_at desc) where status <> 'draft';

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

create table event_attendees (
  event_id uuid not null references events (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'not_going', 'waitlist')),
  checked_in_at timestamptz,
  checked_in_by uuid references members (id) on delete set null,
  activity_id bigint references activities (id) on delete set null,
  note text not null default '',
  -- Thứ tự vào hàng chờ: ai đổi sang waitlist trước thì lên trước
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index event_attendees_member_idx on event_attendees (member_id);

create table event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  uploaded_by uuid references members (id) on delete set null,
  object_key text not null unique,
  thumb_key text not null,
  width int not null check (width > 0),
  height int not null check (height > 0),
  bytes int not null check (bytes > 0),
  taken_at timestamptz,
  caption text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index event_photos_event_idx on event_photos (event_id, coalesce(taken_at, created_at));

alter table events enable row level security;
alter table event_attendees enable row level security;
alter table event_photos enable row level security;

create function event_is_visible(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_bcn() or (
    is_active_member() and exists (
      select 1 from events where id = p_event_id and status <> 'draft'
    )
  );
$$;

create policy events_select on events
  for select to authenticated
  using (is_bcn() or (is_active_member() and status <> 'draft'));
create policy events_write_bcn on events
  for all to authenticated using (is_bcn()) with check (is_bcn());

-- Thành viên chỉ đăng ký qua set_event_attendance (kiểm hạn, chỗ, hàng chờ); ghi trực tiếp chỉ dành cho BCN
create policy event_attendees_select on event_attendees
  for select to authenticated using (event_is_visible(event_id));
create policy event_attendees_write_bcn on event_attendees
  for all to authenticated using (is_bcn()) with check (is_bcn());

-- Quyết định tạm: mọi thành viên upload được vào mọi event đã công bố
create policy event_photos_select on event_photos
  for select to authenticated
  using (is_bcn() or (event_is_visible(event_id) and (not hidden or uploaded_by = (select auth.uid()))));
create policy event_photos_insert_own on event_photos
  for insert to authenticated
  with check (is_active_member() and uploaded_by = (select auth.uid()) and event_is_visible(event_id));
create policy event_photos_delete_own_or_bcn on event_photos
  for delete to authenticated
  using (uploaded_by = (select auth.uid()) or is_bcn());
create policy event_photos_update_bcn on event_photos
  for update to authenticated using (is_bcn()) with check (is_bcn());

-- Cho người đang chờ lên "going" khi còn chỗ; trả về những người vừa được lên để báo cho họ
create function promote_event_waitlist(p_event_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_free int;
begin
  select capacity into v_capacity from events where id = p_event_id and status = 'published';
  if v_capacity is null then
    return query
      update event_attendees set status = 'going', status_changed_at = now()
      where event_id = p_event_id and status = 'waitlist'
      returning member_id;
    return;
  end if;

  select v_capacity - count(*) into v_free
  from event_attendees where event_id = p_event_id and status = 'going';
  if v_free <= 0 then
    return;
  end if;

  return query
    update event_attendees set status = 'going', status_changed_at = now()
    where (event_id, member_id) in (
      select event_id, member_id from event_attendees
      where event_id = p_event_id and status = 'waitlist'
      order by status_changed_at, created_at
      limit v_free
    )
    returning member_id;
end;
$$;

revoke execute on function promote_event_waitlist(uuid) from public, anon, authenticated;

create function set_event_attendance(p_event_id uuid, p_status text, p_note text default '')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_previous text;
  v_going int;
  v_result text := p_status;
begin
  if not is_active_member() then
    raise exception 'not_member';
  end if;
  if p_status not in ('going', 'maybe', 'not_going') then
    raise exception 'invalid_status';
  end if;

  select * into v_event from events where id = p_event_id and status = 'published' for update;
  if not found then
    raise exception 'event_not_open';
  end if;
  if now() >= coalesce(v_event.registration_closes_at, v_event.starts_at) then
    raise exception 'registration_closed';
  end if;

  select status into v_previous from event_attendees where event_id = p_event_id and member_id = auth.uid();

  if p_status = 'going' and v_event.capacity is not null and v_previous is distinct from 'going' then
    select count(*) into v_going from event_attendees where event_id = p_event_id and status = 'going';
    if v_going >= v_event.capacity then
      v_result := 'waitlist';
    end if;
  end if;

  insert into event_attendees (event_id, member_id, status, note)
  values (p_event_id, auth.uid(), v_result, coalesce(p_note, ''))
  on conflict (event_id, member_id) do update
    set status = excluded.status,
        note = excluded.note,
        status_changed_at = case
          when event_attendees.status = excluded.status then event_attendees.status_changed_at
          else now()
        end;

  if v_previous = 'going' and v_result <> 'going' then
    perform promote_event_waitlist(p_event_id);
  end if;
  return v_result;
end;
$$;

grant execute on function set_event_attendance(uuid, text, text) to authenticated;

-- BCN gọi sau khi đổi sức chứa hoặc xoá người đăng ký
create function promote_event_waitlist_bcn(p_event_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_bcn() then
    raise exception 'not_bcn';
  end if;
  return query select * from promote_event_waitlist(p_event_id);
end;
$$;

grant execute on function promote_event_waitlist_bcn(uuid) to authenticated;

-- Số liệu hiển thị trên thẻ event; security invoker nên ảnh ẩn và event nháp vẫn bị RLS chặn như bảng gốc
create view event_counts with (security_invoker = true) as
  select e.id as event_id,
    (select count(*) from event_attendees a where a.event_id = e.id and a.status = 'going') as going_count,
    (select count(*) from event_attendees a where a.event_id = e.id and a.status = 'maybe') as maybe_count,
    (select count(*) from event_attendees a where a.event_id = e.id and a.status = 'waitlist') as waitlist_count,
    (select count(*) from event_photos p where p.event_id = e.id and not p.hidden) as photo_count
  from events e;

revoke all on event_counts from anon;
grant select on event_counts to authenticated;

-- Hoạt động riêng tư chỉ được cộng vào số liệu nhóm nếu chủ hoạt động đã đồng ý (share_private_in_totals)
create function event_attendee_activities(p_event_id uuid)
returns table (member_id uuid, distance_m int, moving_time_s int)
language sql
stable
security definer
set search_path = public
as $$
  select a.member_id, act.distance_m, act.moving_time_s
  from event_attendees a
  join activities act on act.id = a.activity_id
  join members m on m.id = a.member_id
  where a.event_id = p_event_id
    and (not act.private or m.share_private_in_totals)
    and act.counts_for_club;
$$;

revoke execute on function event_attendee_activities(uuid) from public, anon, authenticated;

create function event_run_summary(p_event_id uuid)
returns table (attended_count int, runner_count int, total_distance_m bigint, total_moving_time_s bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not event_is_visible(p_event_id) then
    raise exception 'event_not_visible';
  end if;
  return query
    select
      (select count(*)::int from event_attendees where event_id = p_event_id
        and (checked_in_at is not null or activity_id is not null)),
      count(*)::int,
      coalesce(sum(distance_m), 0)::bigint,
      coalesce(sum(moving_time_s), 0)::bigint
    from event_attendee_activities(p_event_id);
end;
$$;

grant execute on function event_run_summary(uuid) to authenticated;

create function admin_event_stats(p_from timestamptz, p_to timestamptz)
returns table (
  event_id uuid, title text, starts_at timestamptz,
  registered_count int, attended_count int, total_distance_m bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_bcn() then
    raise exception 'not_bcn';
  end if;
  return query
    select e.id, e.title, e.starts_at,
      (select count(*)::int from event_attendees a where a.event_id = e.id and a.status = 'going'),
      (select count(*)::int from event_attendees a
        where a.event_id = e.id and (a.checked_in_at is not null or a.activity_id is not null)),
      coalesce((select sum(s.distance_m) from event_attendee_activities(e.id) s), 0)::bigint
    from events e
    where e.status in ('published', 'done') and e.starts_at >= p_from and e.starts_at < p_to
    order by e.starts_at;
end;
$$;

grant execute on function admin_event_stats(timestamptz, timestamptz) to authenticated;

create function admin_event_top_attendees(p_from timestamptz, p_to timestamptz, p_limit int)
returns table (member_id uuid, display_name text, event_count int)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_bcn() then
    raise exception 'not_bcn';
  end if;
  return query
    select a.member_id, m.display_name, count(*)::int as event_count
    from event_attendees a
    join events e on e.id = a.event_id
    join members m on m.id = a.member_id
    where e.status in ('published', 'done') and e.starts_at >= p_from and e.starts_at < p_to
      and (a.checked_in_at is not null or a.activity_id is not null)
    group by a.member_id, m.display_name
    order by count(*) desc, m.display_name
    limit p_limit;
end;
$$;

grant execute on function admin_event_top_attendees(timestamptz, timestamptz, int) to authenticated;
