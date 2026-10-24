create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  cover_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  goal_type text not null check (
    goal_type in ('total_distance', 'active_days', 'activity_count', 'total_elevation', 'single_distance')
  ),
  activity_filter jsonb not null default '{}'::jsonb,
  participation text not null default 'opt_in' check (participation in ('mandatory_official', 'opt_in', 'invite')),
  registration_closes_at timestamptz,
  ranking text not null default 'value_desc' check (ranking in ('value_desc', 'completed_at_asc')),
  penalty_rule jsonb not null default '{}'::jsonb,
  reward_rule jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'running', 'finalizing', 'closed')),
  created_by uuid references members (id) on delete set null,
  closed_by uuid references members (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create trigger challenges_set_updated_at
  before update on challenges
  for each row execute function set_updated_at();

create index challenges_status_idx on challenges (status, starts_at desc);

-- goal_value: mét (quãng đường, độ cao), số ngày hoặc số buổi tuỳ goal_type
create table challenge_categories (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  goal_value numeric not null check (goal_value > 0),
  gender text check (gender in ('M', 'F', 'X')),
  member_type text check (member_type in ('official', 'free')),
  sort int not null default 0
);

create index challenge_categories_challenge_idx on challenge_categories (challenge_id, sort);

create table challenge_entries (
  challenge_id uuid not null references challenges (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  category_id uuid not null references challenge_categories (id) on delete restrict,
  joined_at timestamptz not null default now(),
  value numeric not null default 0,
  progress_pct numeric not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  rank int,
  last_activity_at timestamptz,
  excluded boolean not null default false,
  excluded_reason text,
  penalty_waived boolean not null default false,
  waived_reason text,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, member_id)
);

create index challenge_entries_member_idx on challenge_entries (member_id);
create index challenge_entries_category_idx on challenge_entries (category_id);

create table challenge_entry_activities (
  challenge_id uuid not null,
  member_id uuid not null,
  activity_id bigint not null references activities (id) on delete cascade,
  counted_value numeric not null,
  primary key (challenge_id, member_id, activity_id),
  foreign key (challenge_id, member_id) references challenge_entries (challenge_id, member_id) on delete cascade
);

alter table challenges enable row level security;
alter table challenge_categories enable row level security;
alter table challenge_entries enable row level security;
alter table challenge_entry_activities enable row level security;

-- Số liệu challenge suy ra từ Strava nên người khác chỉ thấy khi CLB để full_opt_in và người đó đã chia sẻ (task 3.0).
create function can_view_member_stats(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_member_id = auth.uid()
    or is_bcn()
    or (
      is_active_member()
      and exists (select 1 from members where id = p_member_id and status = 'active' and share_stats_with_club)
      and exists (select 1 from settings where key = 'club_display_mode' and value = '"full_opt_in"'::jsonb)
    );
$$;

create policy challenges_select on challenges
  for select to authenticated
  using (is_bcn() or (is_active_member() and status <> 'draft'));
create policy challenges_write_bcn on challenges
  for all to authenticated using (is_bcn()) with check (is_bcn());

create policy challenge_categories_select on challenge_categories
  for select to authenticated
  using (exists (select 1 from challenges where challenges.id = challenge_categories.challenge_id));
create policy challenge_categories_write_bcn on challenge_categories
  for all to authenticated using (is_bcn()) with check (is_bcn());

create policy challenge_entries_select on challenge_entries
  for select to authenticated
  using (
    is_bcn()
    or (
      can_view_member_stats(member_id)
      and exists (select 1 from challenges where challenges.id = challenge_entries.challenge_id)
    )
  );
create policy challenge_entries_write_bcn on challenge_entries
  for all to authenticated using (is_bcn()) with check (is_bcn());

create policy challenge_entry_activities_select on challenge_entry_activities
  for select to authenticated
  using (member_id = (select auth.uid()) or is_bcn());

-- Ghi challenge_entry_activities và tính kết quả: chỉ service role. Thành viên tham gia qua join_challenge().

create function pick_challenge_category(p_challenge_id uuid, p_gender text, p_member_type text)
returns uuid
language sql
stable
as $$
  select id
  from challenge_categories
  where challenge_id = p_challenge_id
    and (gender is null or gender = p_gender)
    and (member_type is null or member_type = p_member_type)
  order by (gender is not null)::int + (member_type is not null)::int desc, sort, name
  limit 1;
$$;

create function join_challenge(p_challenge_id uuid, p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target challenges%rowtype;
begin
  if not is_active_member() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  select * into target from challenges where id = p_challenge_id;
  if not found or target.status not in ('published', 'running') then
    raise exception 'Challenge không mở đăng ký';
  end if;
  if target.participation <> 'opt_in' then
    raise exception 'Challenge này không tự đăng ký';
  end if;
  if now() >= coalesce(target.registration_closes_at, target.ends_at) then
    raise exception 'Đã hết hạn đăng ký';
  end if;
  if not exists (
    select 1 from challenge_categories where id = p_category_id and challenge_id = p_challenge_id
  ) then
    raise exception 'Hạng mục không hợp lệ';
  end if;

  insert into challenge_entries (challenge_id, member_id, category_id)
  values (p_challenge_id, auth.uid(), p_category_id)
  on conflict (challenge_id, member_id) do nothing;
end;
$$;

revoke execute on function join_challenge(uuid, uuid) from public, anon;
grant execute on function join_challenge(uuid, uuid) to authenticated;

-- Ghi danh thành viên chính thức vào các challenge bắt buộc đang mở.
create function auto_enroll_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  person members%rowtype;
  target challenges%rowtype;
  category_id uuid;
begin
  select * into person from members where id = p_member_id;
  if not found or person.status <> 'active' or person.member_type is distinct from 'official' then
    return;
  end if;

  for target in
    select * from challenges
    where participation = 'mandatory_official' and status in ('published', 'running') and ends_at > now()
  loop
    category_id := pick_challenge_category(target.id, person.gender, person.member_type);
    if category_id is not null then
      insert into challenge_entries (challenge_id, member_id, category_id)
      values (target.id, person.id, category_id)
      on conflict (challenge_id, member_id) do nothing;
    end if;
  end loop;
end;
$$;

revoke execute on function auto_enroll_member(uuid) from public, anon, authenticated;

create function members_auto_enroll_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform auto_enroll_member(new.id);
  return new;
end;
$$;

create trigger members_auto_enroll
  after update of member_type, status on members
  for each row
  when (new.status = 'active' and new.member_type = 'official')
  execute function members_auto_enroll_trigger();

create function publish_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target challenges%rowtype;
  person members%rowtype;
  category_id uuid;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  select * into target from challenges where id = p_challenge_id for update;
  if not found or target.status <> 'draft' then
    raise exception 'Chỉ công bố được challenge nháp';
  end if;
  if not exists (select 1 from challenge_categories where challenge_id = p_challenge_id) then
    raise exception 'Cần ít nhất một hạng mục';
  end if;

  update challenges
  set status = case when starts_at <= now() then 'running' else 'published' end
  where id = p_challenge_id;

  if target.participation = 'mandatory_official' then
    for person in select * from members where status = 'active' and member_type = 'official' loop
      category_id := pick_challenge_category(p_challenge_id, person.gender, person.member_type);
      if category_id is not null then
        insert into challenge_entries (challenge_id, member_id, category_id)
        values (p_challenge_id, person.id, category_id)
        on conflict (challenge_id, member_id) do nothing;
      end if;
    end loop;
  end if;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'publish_challenge', 'challenges', p_challenge_id::text, null, jsonb_build_object('title', target.title));
end;
$$;

revoke execute on function publish_challenge(uuid) from public, anon;
grant execute on function publish_challenge(uuid) to authenticated;

-- Xếp hạng lại cả challenge theo từng hạng mục; người bị loại không có hạng.
create function rank_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update challenge_entries set rank = null where challenge_id = p_challenge_id and excluded;

  with ranked as (
    select e.member_id,
      rank() over (
        partition by e.category_id
        order by
          case when c.ranking = 'completed_at_asc' then (not e.completed)::int else 0 end,
          case when c.ranking = 'completed_at_asc' then e.completed_at end asc nulls last,
          e.value desc
      ) as new_rank
    from challenge_entries e
    join challenges c on c.id = e.challenge_id
    where e.challenge_id = p_challenge_id and not e.excluded
  )
  update challenge_entries e
  set rank = ranked.new_rank
  from ranked
  where e.challenge_id = p_challenge_id and e.member_id = ranked.member_id;
end;
$$;

revoke execute on function rank_challenge(uuid) from public, anon, authenticated;
grant execute on function rank_challenge(uuid) to service_role;

-- Chuyển trạng thái theo thời gian; trả về các challenge vừa sang 'finalizing' để tính lại lần cuối.
insert into settings (key, value) values ('challenge_grace_hours', '48'::jsonb) on conflict (key) do nothing;

create function advance_challenge_statuses()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  grace_hours int;
begin
  select coalesce((select (value #>> '{}')::int from settings where key = 'challenge_grace_hours'), 48)
  into grace_hours;

  update challenges set status = 'running' where status = 'published' and starts_at <= now();

  return query
    update challenges
    set status = 'finalizing'
    where status = 'running' and ends_at + make_interval(hours => grace_hours) <= now()
    returning id;
end;
$$;

revoke execute on function advance_challenge_statuses() from public, anon, authenticated;
grant execute on function advance_challenge_statuses() to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table challenge_entries;
  end if;
end;
$$;
