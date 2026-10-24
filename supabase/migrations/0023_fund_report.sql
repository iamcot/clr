-- Báo cáo quỹ, trang công khai cho thành viên và chốt sổ theo tháng (task 17).

alter table fund_transactions add column receipt_public boolean not null default false;

-- Thêm tham số p_receipt_public (ảnh hoá đơn có hiện cho thành viên không)
drop function add_fund_transaction(uuid, text, bigint, uuid, timestamptz, text, uuid, uuid, text);

create function add_fund_transaction(
  p_account_id uuid, p_direction text, p_amount bigint, p_category_id uuid, p_occurred_at timestamptz,
  p_description text, p_member_id uuid, p_event_id uuid, p_receipt_url text, p_receipt_public boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  insert into fund_transactions (account_id, direction, amount, category_id, occurred_at, description, member_id, event_id,
    receipt_url, receipt_public, created_by)
  values (p_account_id, p_direction, p_amount, p_category_id, p_occurred_at, coalesce(p_description, ''), p_member_id, p_event_id,
    nullif(btrim(p_receipt_url), ''), coalesce(p_receipt_public, false), auth.uid())
  returning id into v_id;
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'add_fund_transaction', 'fund_transactions', v_id::text, null,
    jsonb_build_object('direction', p_direction, 'amount', p_amount));
  return v_id;
end;
$$;

revoke execute on function add_fund_transaction(uuid, text, bigint, uuid, timestamptz, text, uuid, uuid, text, boolean) from public, anon;
grant execute on function add_fund_transaction(uuid, text, bigint, uuid, timestamptz, text, uuid, uuid, text, boolean) to authenticated;

create function set_fund_receipt_public(p_id uuid, p_public boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update fund_transactions set receipt_public = p_public where id = p_id;
end;
$$;

revoke execute on function set_fund_receipt_public(uuid, boolean) from public, anon;
grant execute on function set_fund_receipt_public(uuid, boolean) to authenticated;

-- Chốt sổ: mỗi tháng (theo giờ Việt Nam) một dòng đang khoá; mở khoá thì giữ lại dòng cũ kèm lý do
create table fund_period_locks (
  id uuid primary key default gen_random_uuid(),
  month date not null check (date_trunc('month', month) = month),
  locked_at timestamptz not null default now(),
  locked_by uuid references members (id) on delete set null,
  note text not null default '',
  unlocked_at timestamptz,
  unlocked_by uuid references members (id) on delete set null,
  unlock_reason text
);

create unique index fund_period_locks_active_idx on fund_period_locks (month) where unlocked_at is null;

alter table fund_period_locks enable row level security;
create policy fund_period_locks_select on fund_period_locks for select to authenticated using (can_manage_fund());

create function fund_month_start(p_moment timestamptz)
returns date
language sql
immutable
as $$
  select date_trunc('month', p_moment at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

create function is_fund_month_locked(p_moment timestamptz)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from fund_period_locks where month = fund_month_start(p_moment) and unlocked_at is null);
$$;

-- Tháng đã chốt thì không thêm hay huỷ giao dịch. Tiền vào từ webhook ngân hàng vẫn được ghi vì tiền đã về thật
create function fund_transactions_period_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.bank_event_id is null and is_fund_month_locked(new.occurred_at) then
    raise exception 'Tháng này đã chốt sổ, không thêm được giao dịch';
  end if;
  if tg_op = 'UPDATE' and new.voided_at is not null and old.voided_at is null and is_fund_month_locked(old.occurred_at) then
    raise exception 'Tháng này đã chốt sổ, không huỷ được giao dịch';
  end if;
  return new;
end;
$$;

create trigger fund_transactions_period_guard_trigger
  before insert or update on fund_transactions
  for each row execute function fund_transactions_period_guard();

create function lock_fund_month(p_month date, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', p_month)::date;
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if v_month >= fund_month_start(now()) then
    raise exception 'Chỉ chốt được tháng đã qua';
  end if;
  insert into fund_period_locks (month, locked_by, note) values (v_month, auth.uid(), coalesce(p_note, ''));
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'lock_fund_month', 'fund_period_locks', v_month::text, null, jsonb_build_object('note', p_note));
end;
$$;

create function unlock_fund_month(p_month date, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', p_month)::date;
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'Mở khoá cần lý do';
  end if;
  update fund_period_locks
  set unlocked_at = now(), unlocked_by = auth.uid(), unlock_reason = btrim(p_reason)
  where month = v_month and unlocked_at is null;
  if not found then
    raise exception 'Tháng này chưa chốt sổ';
  end if;
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'unlock_fund_month', 'fund_period_locks', v_month::text, null, jsonb_build_object('reason', p_reason));
end;
$$;

revoke execute on function lock_fund_month(date, text) from public, anon;
revoke execute on function unlock_fund_month(date, text) from public, anon;
grant execute on function lock_fund_month(date, text) to authenticated;
grant execute on function unlock_fund_month(date, text) to authenticated;

-- Báo cáo: dòng 'opening' là số dư đầu kỳ, các dòng 'category' là tổng thu/chi theo danh mục; giao dịch đã huỷ bị bỏ
create function fund_report_rows(p_from timestamptz, p_to timestamptz)
returns table (kind text, direction text, category text, amount bigint)
language sql
stable
security definer
set search_path = public
as $$
  select 'opening', null::text, null::text,
    coalesce(sum(case when t.direction = 'in' then t.amount else -t.amount end), 0)::bigint
  from fund_transactions t
  where is_active_member() and t.voided_at is null and t.occurred_at < p_from
  union all
  select 'category', t.direction, coalesce(c.name, 'Chưa phân loại'), sum(t.amount)::bigint
  from fund_transactions t
  left join fund_categories c on c.id = t.category_id
  where is_active_member() and t.voided_at is null and t.occurred_at >= p_from and t.occurred_at < p_to
  group by t.direction, coalesce(c.name, 'Chưa phân loại');
$$;

-- Khoản phạt phát sinh trong kỳ (theo ngày tạo) và tình trạng hiện tại của chúng
create function fund_penalty_report(p_from timestamptz, p_to timestamptz)
returns table (issued_count bigint, issued_amount bigint, collected_amount bigint, outstanding_amount bigint, waived_amount bigint)
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint,
    coalesce(sum(p.amount), 0)::bigint,
    coalesce(sum(p.amount) filter (where p.status = 'paid'), 0)::bigint,
    coalesce(sum(p.amount) filter (where p.status = 'unpaid'), 0)::bigint,
    coalesce(sum(p.amount) filter (where p.status = 'waived'), 0)::bigint
  from penalties p
  where is_active_member() and p.created_at >= p_from and p.created_at < p_to;
$$;

create function fund_monthly(p_months int)
returns table (month text, income bigint, expense bigint)
language sql
stable
security definer
set search_path = public
as $$
  with months as (
    select generate_series(
      date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') - ((greatest(p_months, 1) - 1) * interval '1 month'),
      date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh'),
      interval '1 month'
    ) as m
  )
  select to_char(months.m, 'YYYY-MM'),
    coalesce(sum(t.amount) filter (where t.direction = 'in'), 0)::bigint,
    coalesce(sum(t.amount) filter (where t.direction = 'out'), 0)::bigint
  from months
  left join fund_transactions t
    on is_active_member() and t.voided_at is null
    and date_trunc('month', t.occurred_at at time zone 'Asia/Ho_Chi_Minh') = months.m
  group by months.m
  order by months.m;
$$;

-- Khoản chi trong kỳ cho thành viên xem; ảnh hoá đơn chỉ hiện khi BCN chọn công khai
create function fund_public_expenses(p_from timestamptz, p_to timestamptz)
returns table (id uuid, occurred_at timestamptz, description text, amount bigint, category text, receipt_url text)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.occurred_at, t.description, t.amount, coalesce(c.name, 'Chưa phân loại'),
    case when t.receipt_public then t.receipt_url else null end
  from fund_transactions t
  left join fund_categories c on c.id = t.category_id
  where is_active_member() and t.direction = 'out' and t.voided_at is null
    and t.occurred_at >= p_from and t.occurred_at < p_to
  order by t.occurred_at desc
  limit 300;
$$;

revoke execute on function fund_report_rows(timestamptz, timestamptz) from public, anon;
revoke execute on function fund_penalty_report(timestamptz, timestamptz) from public, anon;
revoke execute on function fund_monthly(int) from public, anon;
revoke execute on function fund_public_expenses(timestamptz, timestamptz) from public, anon;
grant execute on function fund_report_rows(timestamptz, timestamptz) to authenticated;
grant execute on function fund_penalty_report(timestamptz, timestamptz) to authenticated;
grant execute on function fund_monthly(int) to authenticated;
grant execute on function fund_public_expenses(timestamptz, timestamptz) to authenticated;

insert into settings (key, value) values ('fund_close_autopost', 'true'::jsonb) on conflict (key) do nothing;
