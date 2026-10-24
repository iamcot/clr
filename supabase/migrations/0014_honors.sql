-- Danh hiệu trên bảng vàng. Kỷ lục CLB tính trực tiếp từ race_results đã xác minh nên không cần bảng riêng.
create table honors (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  kind text not null check (kind in ('podium', 'challenge_champion', 'milestone', 'special')),
  title text not null check (btrim(title) <> ''),
  detail text not null default '',
  honor_date date not null,
  race_result_id uuid references race_results (id) on delete set null,
  challenge_id uuid references challenges (id) on delete set null,
  image_url text,
  approved boolean not null default false,
  -- Khoá chống sinh trùng danh hiệu tự động, ví dụ 'podium:<race_result_id>' hoặc 'milestone:<member_id>:1000'
  dedupe_key text unique,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index honors_member_idx on honors (member_id, honor_date desc);
create index honors_kind_idx on honors (kind, honor_date desc) where approved;

alter table honors enable row level security;

create policy honors_select_approved on honors
  for select to authenticated using (is_bcn() or (approved and is_active_member()));
create policy honors_insert_bcn on honors
  for insert to authenticated with check (is_bcn());
create policy honors_update_bcn on honors
  for update to authenticated using (is_bcn()) with check (is_bcn());
create policy honors_delete_bcn on honors
  for delete to authenticated using (is_bcn());

-- Sinh danh hiệu chờ duyệt từ dữ liệu đã có; trả về số danh hiệu mới. Mốc km truyền từ src/config/hallOfFame.ts.
create function generate_honors(p_milestones_km int[], p_first_marathon_min_m int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count int := 0;
  step_count int;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  insert into honors (member_id, kind, title, detail, honor_date, race_result_id, dedupe_key)
  select r.member_id, 'podium',
    case
      when r.rank_overall between 1 and 3 then 'Hạng ' || r.rank_overall || ' toàn giải ' || r.distance_label
      else 'Hạng ' || r.rank_age_group || ' lứa tuổi ' || r.distance_label
    end,
    races.name,
    races.race_date, r.id, 'podium:' || r.id
  from race_results r
  join races on races.id = r.race_id
  where r.verified_at is not null
    and (r.rank_overall between 1 and 3 or r.rank_age_group between 1 and 3)
  on conflict (dedupe_key) do nothing;
  get diagnostics step_count = row_count;
  inserted_count := inserted_count + step_count;

  insert into honors (member_id, kind, title, detail, honor_date, challenge_id, dedupe_key)
  select e.member_id, 'challenge_champion', 'Vô địch ' || c.title,
    cat.name,
    coalesce(c.closed_at, c.ends_at)::date, c.id, 'champion:' || c.id || ':' || cat.id
  from challenge_entries e
  join challenges c on c.id = e.challenge_id
  join challenge_categories cat on cat.id = e.category_id
  where c.status = 'closed' and e.rank = 1 and not e.excluded
  on conflict (dedupe_key) do nothing;
  get diagnostics step_count = row_count;
  inserted_count := inserted_count + step_count;

  insert into honors (member_id, kind, title, detail, honor_date, dedupe_key)
  select s.member_id, 'milestone', 'Đạt ' || threshold || ' km tích luỹ',
    'Tổng quãng đường trong CLB', (now() at time zone 'Asia/Ho_Chi_Minh')::date,
    'milestone:' || s.member_id || ':' || threshold
  from member_stats_period s
  join members m on m.id = s.member_id and m.status = 'active'
  cross join unnest(p_milestones_km) as threshold
  where s.period_type = 'all' and s.distance_m >= threshold::bigint * 1000
  on conflict (dedupe_key) do nothing;
  get diagnostics step_count = row_count;
  inserted_count := inserted_count + step_count;

  insert into honors (member_id, kind, title, detail, honor_date, race_result_id, dedupe_key)
  select distinct on (r.member_id) r.member_id, 'milestone', 'Hoàn thành marathon đầu tiên', races.name,
    races.race_date, r.id, 'milestone:' || r.member_id || ':first_marathon'
  from race_results r
  join races on races.id = r.race_id
  where r.verified_at is not null and r.distance_m >= p_first_marathon_min_m
  order by r.member_id, races.race_date
  on conflict (dedupe_key) do nothing;
  get diagnostics step_count = row_count;
  inserted_count := inserted_count + step_count;

  return inserted_count;
end;
$$;

revoke execute on function generate_honors(int[], int) from public, anon;
grant execute on function generate_honors(int[], int) to authenticated;
