alter table members add column share_stats_with_club boolean not null default false;

create table activities (
  id bigint primary key,
  member_id uuid not null references members (id) on delete cascade,
  name text not null default '',
  sport_type text not null,
  start_date timestamptz not null,
  start_date_local timestamp not null,
  timezone text,
  distance_m int not null default 0,
  moving_time_s int not null default 0,
  elapsed_time_s int not null default 0,
  elevation_gain_m numeric(7, 1) not null default 0,
  average_heartrate numeric(5, 1),
  max_heartrate numeric(5, 1),
  average_cadence numeric(5, 1),
  manual boolean not null default false,
  trainer boolean not null default false,
  visibility text not null default 'everyone' check (visibility in ('everyone', 'followers_only', 'only_me')),
  private boolean not null default false,
  summary_polyline text,
  start_latlng point,
  passes_rules boolean not null default true,
  flagged_invalid boolean not null default false,
  invalid_reason text,
  counts_for_club boolean generated always as (passes_rules and not flagged_invalid) stored,
  detail_fetched boolean not null default false,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_member_start_idx on activities (member_id, start_date desc);
create index activities_start_idx on activities (start_date);
create index activities_detail_pending_idx on activities (start_date desc) where not detail_fetched;

create trigger activities_set_updated_at
  before update on activities
  for each row execute function set_updated_at();

create table activity_best_efforts (
  activity_id bigint not null references activities (id) on delete cascade,
  name text not null,
  distance_m int not null,
  elapsed_time_s int not null,
  pr_rank int,
  primary key (activity_id, name)
);

create table strava_rate_state (
  window_name text primary key check (window_name in ('read_15m', 'read_day', 'all_15m', 'all_day')),
  request_limit int not null,
  usage int not null,
  updated_at timestamptz not null default now()
);

create table strava_events (
  id bigint generated always as identity primary key,
  object_type text not null,
  object_id bigint not null,
  aspect_type text not null,
  owner_id bigint not null,
  updates jsonb,
  event_time timestamptz not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  unique (object_type, object_id, aspect_type, owner_id, event_time)
);

create index strava_events_pending_idx on strava_events (next_attempt_at) where processed_at is null;

create table backfill_jobs (
  member_id uuid primary key references members (id) on delete cascade,
  from_date date not null,
  cursor_before timestamptz,
  pages_done int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  last_run_at timestamptz,
  error text
);

alter table activities enable row level security;
alter table activity_best_efforts enable row level security;
alter table strava_rate_state enable row level security;
alter table strava_events enable row level security;
alter table backfill_jobs enable row level security;

create policy activities_select_own on activities
  for select
  to authenticated
  using (member_id = (select auth.uid()));

create policy activities_delete_own on activities
  for delete
  to authenticated
  using (member_id = (select auth.uid()));

create policy best_efforts_select_own on activity_best_efforts
  for select
  to authenticated
  using (exists (
    select 1 from activities where activities.id = activity_best_efforts.activity_id
      and activities.member_id = (select auth.uid())
  ));

create policy backfill_jobs_select_own_or_bcn on backfill_jobs
  for select
  to authenticated
  using (member_id = (select auth.uid()) or is_bcn());

create policy strava_rate_state_select_bcn on strava_rate_state
  for select
  to authenticated
  using (is_bcn());

create policy strava_events_select_bcn on strava_events
  for select
  to authenticated
  using (is_bcn());

-- Ghi vào activities, best efforts, strava_events, strava_rate_state, backfill_jobs: chỉ service role.

-- Người khác chỉ thấy số liệu tối thiểu của người đã đồng ý chia sẻ; không có tên hoạt động, bản đồ, raw.
create view activities_club as
  select a.id, a.member_id, a.sport_type, a.start_date, a.start_date_local, a.distance_m, a.moving_time_s,
    a.elapsed_time_s, a.elevation_gain_m, a.counts_for_club
  from activities a
  join members m on m.id = a.member_id
  where m.share_stats_with_club
    and m.status = 'active'
    and not a.private
    and a.visibility <> 'only_me';

-- BCN rà soát hoạt động bị luật loại; vẫn không thấy hoạt động riêng tư.
create view activities_review as
  select a.id, a.member_id, m.display_name, a.name, a.sport_type, a.start_date, a.distance_m, a.moving_time_s,
    a.manual, a.passes_rules, a.flagged_invalid, a.invalid_reason, a.counts_for_club
  from activities a
  join members m on m.id = a.member_id
  where is_bcn()
    and not a.private
    and a.visibility <> 'only_me';

revoke all on activities_club from anon;
revoke all on activities_review from anon;
grant select on activities_club to authenticated;
grant select on activities_review to authenticated;

create function set_activity_flag(p_activity_id bigint, p_flagged boolean, p_reason text)
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
end;
$$;

revoke execute on function set_activity_flag(bigint, boolean, text) from public, anon;
grant execute on function set_activity_flag(bigint, boolean, text) to authenticated;
