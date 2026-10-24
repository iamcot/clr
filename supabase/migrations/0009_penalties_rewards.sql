create table penalty_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  default_amount bigint not null default 0 check (default_amount >= 0),
  active boolean not null default true
);

insert into penalty_types (code, name, default_amount) values
  ('challenge_fail', 'Không đạt challenge', 100000),
  ('challenge_low', 'Đạt dưới mức tối thiểu của challenge', 200000),
  ('event_absent', 'Đăng ký event nhưng vắng', 50000),
  ('rule_violation', 'Vi phạm quy chế', 100000),
  ('other', 'Khác', 0);

create table penalties (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  type_id uuid not null references penalty_types (id),
  amount bigint not null check (amount >= 0),
  reason text not null default '',
  source_type text check (source_type in ('challenge', 'event', 'manual')),
  source_id uuid,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'waived')),
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_method text check (paid_method in ('cash', 'transfer', 'vietqr')),
  confirmed_by uuid references members (id) on delete set null,
  waived_reason text,
  payment_ref text,
  -- source_id null thì các dòng không coi là trùng nhau, nên phạt tay không bị chặn
  unique (member_id, source_type, source_id, type_id)
);

create index penalties_member_idx on penalties (member_id, created_at desc);
create index penalties_status_idx on penalties (status, created_at desc);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  title text not null,
  amount bigint check (amount is null or amount > 0),
  item text,
  source_type text check (source_type in ('challenge', 'event', 'manual')),
  source_id uuid,
  status text not null default 'pending' check (status in ('pending', 'given')),
  given_at timestamptz,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, source_type, source_id, title)
);

create index rewards_member_idx on rewards (member_id, created_at desc);

alter table penalty_types enable row level security;
alter table penalties enable row level security;
alter table rewards enable row level security;

-- Người được ghi thu quỹ: thủ quỹ, hoặc BCN (chưa có thủ quỹ thì BCN làm thay)
create function can_manage_fund()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members where id = auth.uid() and role in ('bcn', 'treasurer') and status = 'active'
  );
$$;

create policy penalty_types_select on penalty_types
  for select to authenticated using (is_active_member() or is_bcn());
create policy penalty_types_write_bcn on penalty_types
  for all to authenticated using (is_bcn()) with check (is_bcn());

create policy penalties_select on penalties
  for select to authenticated using (member_id = (select auth.uid()) or can_manage_fund());
create policy penalties_insert_bcn on penalties
  for insert to authenticated with check (is_bcn() and status = 'unpaid');
create policy penalties_update_fund on penalties
  for update to authenticated using (can_manage_fund()) with check (can_manage_fund());
create policy penalties_delete_bcn on penalties
  for delete to authenticated using (is_bcn() and status = 'unpaid');

create policy rewards_select on rewards
  for select to authenticated using (member_id = (select auth.uid()) or can_manage_fund());
create policy rewards_write_bcn on rewards
  for all to authenticated using (is_bcn()) with check (is_bcn());

-- Khoản đã nộp thì không sửa số tiền hay người nộp; muốn sửa phải huỷ trạng thái nộp trước (có log).
create function penalties_guard()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'paid' and new.status = 'paid'
    and (new.amount is distinct from old.amount or new.member_id is distinct from old.member_id) then
    raise exception 'Khoản đã nộp, huỷ trạng thái nộp trước khi sửa';
  end if;
  if new.status = 'waived' and coalesce(btrim(new.waived_reason), '') = '' then
    raise exception 'Miễn phạt cần lý do';
  end if;
  return new;
end;
$$;

create trigger penalties_guard_trigger
  before update on penalties
  for each row execute function penalties_guard();

-- Thành viên tự đổi trạng thái khoản của mình: không có policy update cho thành viên, nên không thể.

create function mark_penalties_paid(p_ids uuid[], p_method text, p_ref text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  changed int;
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update penalties
  set status = 'paid', paid_at = now(), paid_method = p_method, payment_ref = nullif(btrim(p_ref), ''),
      confirmed_by = auth.uid()
  where id = any (p_ids) and status = 'unpaid';
  get diagnostics changed = row_count;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'mark_penalties_paid', 'penalties', null, null,
    jsonb_build_object('ids', to_jsonb(p_ids), 'method', p_method, 'changed', changed));
  return changed;
end;
$$;

create function waive_penalties(p_ids uuid[], p_reason text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  changed int;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update penalties
  set status = 'waived', waived_reason = p_reason, confirmed_by = auth.uid()
  where id = any (p_ids) and status = 'unpaid';
  get diagnostics changed = row_count;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'waive_penalties', 'penalties', null, null,
    jsonb_build_object('ids', to_jsonb(p_ids), 'reason', p_reason, 'changed', changed));
  return changed;
end;
$$;

create function unmark_penalty_paid(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update penalties
  set status = 'unpaid', paid_at = null, paid_method = null, payment_ref = null, confirmed_by = null
  where id = p_id and status = 'paid';

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'unmark_penalty_paid', 'penalties', p_id::text, null, jsonb_build_object('reason', p_reason));
end;
$$;

revoke execute on function mark_penalties_paid(uuid[], text, text) from public, anon;
revoke execute on function waive_penalties(uuid[], text) from public, anon;
revoke execute on function unmark_penalty_paid(uuid, text) from public, anon;
grant execute on function mark_penalties_paid(uuid[], text, text) to authenticated;
grant execute on function waive_penalties(uuid[], text) to authenticated;
grant execute on function unmark_penalty_paid(uuid, text) to authenticated;

-- Bảng minh bạch: tổng phạt theo người trong khoảng thời gian, không kèm lý do chi tiết.
create function penalty_totals(p_from timestamptz, p_to timestamptz)
returns table (member_id uuid, display_name text, total_amount bigint, unpaid_amount bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.member_id, m.display_name,
    coalesce(sum(p.amount) filter (where p.status <> 'waived'), 0)::bigint,
    coalesce(sum(p.amount) filter (where p.status = 'unpaid'), 0)::bigint
  from penalties p
  join members m on m.id = p.member_id
  where is_active_member()
    and coalesce((select (value #>> '{}')::boolean from settings where key = 'penalty_totals_public'), true)
    and p.created_at >= p_from and p.created_at < p_to
  group by p.member_id, m.display_name
  having sum(p.amount) filter (where p.status <> 'waived') > 0
  order by 3 desc;
$$;

revoke execute on function penalty_totals(timestamptz, timestamptz) from public, anon;
grant execute on function penalty_totals(timestamptz, timestamptz) to authenticated;

insert into settings (key, value) values
  ('penalty_totals_public', 'true'::jsonb),
  ('fund_bank_name', '""'::jsonb),
  ('fund_account_number', '""'::jsonb),
  ('fund_account_holder', '""'::jsonb)
on conflict (key) do nothing;
