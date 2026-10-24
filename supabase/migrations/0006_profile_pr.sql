create function is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from members where id = auth.uid() and status = 'active');
$$;

create table pr_overrides (
  member_id uuid not null references members (id) on delete cascade,
  distance_name text not null,
  time_s int not null check (time_s > 0),
  source text not null default 'manual' check (source in ('manual', 'race')),
  race_result_id uuid,
  note text,
  created_at timestamptz not null default now(),
  primary key (member_id, distance_name)
);

create table races (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  race_date date not null,
  city text,
  organizer text,
  url text,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, race_date)
);

create table race_results (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  race_id uuid not null references races (id) on delete restrict,
  distance_label text not null check (btrim(distance_label) <> ''),
  distance_m int not null check (distance_m > 0),
  chip_time_s int not null check (chip_time_s > 0),
  gun_time_s int check (gun_time_s is null or gun_time_s > 0),
  rank_overall int check (rank_overall is null or rank_overall > 0),
  rank_age_group int check (rank_age_group is null or rank_age_group > 0),
  bib text,
  certificate_url text,
  activity_id bigint references activities (id) on delete set null,
  verified_by uuid references members (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index race_results_member_idx on race_results (member_id, created_at desc);
create index race_results_race_idx on race_results (race_id);

alter table pr_overrides
  add constraint pr_overrides_race_result_fkey foreign key (race_result_id) references race_results (id) on delete set null;

alter table pr_overrides enable row level security;
alter table races enable row level security;
alter table race_results enable row level security;

-- PR ghi đè là dữ liệu nhập tay (thời gian chip) nên thành viên khác được xem.
create policy pr_overrides_select_active on pr_overrides
  for select to authenticated using (is_active_member());
create policy pr_overrides_insert_own on pr_overrides
  for insert to authenticated with check (member_id = (select auth.uid()));
create policy pr_overrides_update_own on pr_overrides
  for update to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));
create policy pr_overrides_delete_own on pr_overrides
  for delete to authenticated using (member_id = (select auth.uid()));

create policy races_select_active on races
  for select to authenticated using (is_active_member());
create policy races_insert_active on races
  for insert to authenticated
  with check (is_active_member() and created_by = (select auth.uid()));
create policy races_update_bcn on races
  for update to authenticated using (is_bcn()) with check (is_bcn());

-- Kết quả giải là dữ liệu nhập tay nên thành viên khác được xem; xác minh chỉ qua hàm của BCN.
create policy race_results_select_active on race_results
  for select to authenticated using (is_active_member());
create policy race_results_insert_own on race_results
  for insert to authenticated
  with check (member_id = (select auth.uid()) and verified_by is null and verified_at is null);
create policy race_results_update_own on race_results
  for update to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()) and verified_by is null and verified_at is null);
create policy race_results_delete_own on race_results
  for delete to authenticated using (member_id = (select auth.uid()));

-- Sửa kết quả đã xác minh thì mất dấu xác minh, tránh người dùng đổi số sau khi BCN duyệt.
create function race_results_reset_verification()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not is_bcn() then
    new.verified_by := null;
    new.verified_at := null;
  end if;
  return new;
end;
$$;

create trigger race_results_reset_verification
  before update on race_results
  for each row execute function race_results_reset_verification();

create function admin_verify_race_result(p_result_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row race_results%rowtype;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  select * into before_row from race_results where id = p_result_id;
  if not found then
    raise exception 'Không tìm thấy kết quả';
  end if;

  update race_results
  set verified_by = case when p_verified then auth.uid() end,
      verified_at = case when p_verified then now() end
  where id = p_result_id;

  perform log_audit(
    case when p_verified then 'verify_race_result' else 'unverify_race_result' end,
    'race_results',
    p_result_id::text,
    jsonb_build_object('verified_at', before_row.verified_at),
    jsonb_build_object('verified', p_verified)
  );
end;
$$;

revoke execute on function admin_verify_race_result(uuid, boolean) from public, anon;
grant execute on function admin_verify_race_result(uuid, boolean) to authenticated;

-- BCN xem toàn bộ kết quả giải để xác minh (dữ liệu nhập tay, không phải dữ liệu Strava).
create view race_results_review as
  select r.id, r.member_id, m.display_name, races.name as race_name, races.race_date, r.distance_label,
    r.distance_m, r.chip_time_s, r.rank_overall, r.bib, r.certificate_url, r.verified_at
  from race_results r
  join members m on m.id = r.member_id
  join races on races.id = r.race_id
  where is_bcn();

-- PR từ Strava của chính mình (RLS của bảng gốc áp dụng cho người gọi).
create view member_prs
with (security_invoker = on) as
  select distinct on (a.member_id, lower(e.name))
    a.member_id, lower(e.name) as distance_name, e.elapsed_time_s, a.id as activity_id, a.start_date
  from activity_best_efforts e
  join activities a on a.id = e.activity_id
  where a.counts_for_club
  order by a.member_id, lower(e.name), e.elapsed_time_s, a.start_date;

-- PR từ Strava của người khác: chỉ người đã đồng ý chia sẻ, bỏ hoạt động riêng tư.
create view member_prs_club as
  select distinct on (a.member_id, lower(e.name))
    a.member_id, lower(e.name) as distance_name, e.elapsed_time_s, a.start_date
  from activity_best_efforts e
  join activities a on a.id = e.activity_id
  join members m on m.id = a.member_id
  where a.counts_for_club
    and m.share_stats_with_club
    and m.status = 'active'
    and not a.private
    and a.visibility <> 'only_me'
  order by a.member_id, lower(e.name), e.elapsed_time_s, a.start_date;

revoke all on member_prs from anon;
revoke all on member_prs_club from anon;
revoke all on race_results_review from anon;
grant select on member_prs to authenticated;
grant select on member_prs_club to authenticated;
grant select on race_results_review to authenticated;
