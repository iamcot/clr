-- Sổ quỹ, nộp phạt bằng VietQR và đối soát webhook ngân hàng (task 16).
-- Giao dịch quỹ không xoá, không sửa số tiền: sai thì huỷ (voided_at) rồi ghi dòng mới.

create table fund_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('bank', 'cash')),
  bank_bin text,
  account_no text,
  account_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into fund_accounts (name, kind) values
  ('Quỹ tiền mặt', 'cash'),
  ('Tài khoản ngân hàng của quỹ', 'bank');

create table fund_categories (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in', 'out')),
  name text not null,
  sort int not null default 0,
  unique (direction, name)
);

insert into fund_categories (direction, name, sort) values
  ('in', 'Phạt', 1), ('in', 'Đóng quỹ', 2), ('in', 'Tài trợ', 3), ('in', 'Khác', 4),
  ('out', 'Event', 1), ('out', 'Giải thưởng', 2), ('out', 'Áo/đồng phục', 3), ('out', 'Vận hành app', 4), ('out', 'Khác', 5);

-- Mỗi webhook ngân hàng được ghi nguyên văn; provider_txn_id unique để webhook gửi lại không cộng tiền hai lần
create table bank_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_txn_id text not null,
  direction text not null check (direction in ('in', 'out')),
  amount bigint not null check (amount > 0),
  content text not null default '',
  account_no text not null default '',
  transferred_at timestamptz not null,
  raw jsonb not null,
  received_at timestamptz not null default now(),
  match_status text not null default 'received'
    check (match_status in ('received', 'paid', 'mismatch', 'needs_review', 'unmatched', 'duplicate', 'ignored', 'resolved')),
  matched_intent_id uuid,
  suggested_member_id uuid references members (id) on delete set null,
  processed_at timestamptz,
  unique (provider, provider_txn_id)
);

create table payment_intents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  ref text not null unique,
  method text not null default 'bank' check (method in ('bank', 'cash')),
  amount bigint not null check (amount > 0),
  penalty_ids uuid[] not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'mismatch', 'cash_pending', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  paid_at timestamptz,
  bank_event_id uuid references bank_webhook_events (id) on delete set null
);

create index payment_intents_member_idx on payment_intents (member_id, created_at desc);
create index payment_intents_status_idx on payment_intents (status, created_at desc);

alter table bank_webhook_events
  add constraint bank_webhook_events_intent_fkey foreign key (matched_intent_id) references payment_intents (id) on delete set null;

create table fund_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references fund_accounts (id),
  direction text not null check (direction in ('in', 'out')),
  amount bigint not null check (amount > 0),
  category_id uuid references fund_categories (id),
  occurred_at timestamptz not null default now(),
  description text not null default '',
  member_id uuid references members (id) on delete set null,
  penalty_id uuid references penalties (id) on delete set null,
  event_id uuid references events (id) on delete set null,
  intent_id uuid references payment_intents (id) on delete set null,
  bank_event_id uuid references bank_webhook_events (id) on delete set null,
  receipt_url text,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text
);

create index fund_transactions_account_idx on fund_transactions (account_id, occurred_at desc);
create index fund_transactions_bank_event_idx on fund_transactions (bank_event_id) where bank_event_id is not null;

create table fund_reconciliations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references fund_accounts (id),
  as_of date not null,
  statement_balance bigint not null,
  app_balance bigint not null,
  difference bigint not null,
  note text not null default '',
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table fund_accounts enable row level security;
alter table fund_categories enable row level security;
alter table bank_webhook_events enable row level security;
alter table payment_intents enable row level security;
alter table fund_transactions enable row level security;
alter table fund_reconciliations enable row level security;

create policy fund_accounts_select on fund_accounts for select to authenticated using (can_manage_fund());
create policy fund_accounts_write_bcn on fund_accounts for all to authenticated using (is_bcn()) with check (is_bcn());
create policy fund_categories_select on fund_categories for select to authenticated using (can_manage_fund());
create policy bank_webhook_events_select on bank_webhook_events for select to authenticated using (can_manage_fund());
create policy payment_intents_select on payment_intents
  for select to authenticated using (member_id = (select auth.uid()) or can_manage_fund());
create policy fund_transactions_select on fund_transactions for select to authenticated using (can_manage_fund());
create policy fund_reconciliations_select on fund_reconciliations for select to authenticated using (can_manage_fund());
-- Không có policy ghi: mọi thao tác ghi đi qua các hàm bên dưới hoặc service role

create function fund_transactions_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Giao dịch quỹ không xoá được, hãy huỷ và ghi dòng mới';
  end if;
  if new.amount is distinct from old.amount
    or new.direction is distinct from old.direction
    or new.account_id is distinct from old.account_id
    or new.occurred_at is distinct from old.occurred_at
    or new.bank_event_id is distinct from old.bank_event_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Không sửa được số tiền, chiều thu chi, tài khoản hay thời điểm của giao dịch quỹ';
  end if;
  if old.voided_at is not null and (new.voided_at is distinct from old.voided_at or new.void_reason is distinct from old.void_reason) then
    raise exception 'Giao dịch đã huỷ, không đổi được';
  end if;
  if new.voided_at is not null and old.voided_at is null and coalesce(btrim(new.void_reason), '') = '' then
    raise exception 'Huỷ giao dịch cần lý do';
  end if;
  return new;
end;
$$;

create trigger fund_transactions_guard_trigger
  before update or delete on fund_transactions
  for each row execute function fund_transactions_guard();

create view fund_balances with (security_invoker = true) as
  select a.id as account_id, a.name, a.kind,
    coalesce(sum(case when t.direction = 'in' then t.amount else -t.amount end) filter (where t.voided_at is null), 0)::bigint as balance
  from fund_accounts a
  left join fund_transactions t on t.account_id = a.id
  group by a.id, a.name, a.kind;

revoke all on fund_balances from anon;
grant select on fund_balances to authenticated;

-- Thành viên cần số tài khoản để vẽ mã QR nhưng không đọc được bảng fund_accounts
create function get_fund_receiving_account()
returns table (bank_bin text, account_no text, account_name text)
language sql
stable
security definer
set search_path = public
as $$
  select a.bank_bin, a.account_no, a.account_name
  from fund_accounts a
  where a.kind = 'bank' and a.active and coalesce(a.bank_bin, '') <> '' and coalesce(a.account_no, '') <> ''
    and is_active_member()
  order by a.created_at
  limit 1;
$$;

revoke execute on function get_fund_receiving_account() from public, anon;
grant execute on function get_fund_receiving_account() to authenticated;

create function fund_category_id(p_direction text, p_name text)
returns uuid
language sql
stable
as $$
  select id from fund_categories where direction = p_direction and name = p_name;
$$;

create function random_payment_ref()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- Tạo lần nộp cho các khoản phạt của chính người gọi; số tiền tính ở đây, không tin client
create function create_payment_intent(p_penalty_ids uuid[], p_method text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid := auth.uid();
  v_total bigint;
  v_count int;
  v_sorted uuid[];
  v_existing uuid;
  v_ref text;
  v_id uuid;
begin
  if not is_active_member() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if p_method not in ('bank', 'cash') then
    raise exception 'Hình thức nộp không hợp lệ';
  end if;
  select array_agg(x order by x) into v_sorted from unnest(p_penalty_ids) x;
  select coalesce(sum(amount), 0), count(*) into v_total, v_count
  from penalties
  where id = any (v_sorted) and member_id = v_member and status = 'unpaid';
  if v_sorted is null or v_count <> array_length(v_sorted, 1) or v_total <= 0 then
    raise exception 'Các khoản phạt không hợp lệ hoặc đã được nộp';
  end if;

  select id into v_existing
  from payment_intents
  where member_id = v_member and method = p_method
    and status in ('pending', 'cash_pending') and expires_at > now()
    and (select array_agg(x order by x) from unnest(penalty_ids) x) = v_sorted
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  for attempt in 1..20 loop
    v_ref := random_payment_ref();
    exit when not exists (select 1 from payment_intents where ref = v_ref);
    v_ref := null;
  end loop;
  if v_ref is null then
    raise exception 'Không tạo được mã nộp, thử lại';
  end if;

  insert into payment_intents (member_id, ref, method, amount, penalty_ids, status, expires_at)
  values (v_member, v_ref, p_method, v_total, v_sorted,
    case when p_method = 'cash' then 'cash_pending' else 'pending' end,
    now() + interval '24 hours')
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function create_payment_intent(uuid[], text) from public, anon;
grant execute on function create_payment_intent(uuid[], text) to authenticated;

-- Đánh dấu lần nộp đã thanh toán: các khoản phạt thành "đã nộp", giao dịch quỹ được phân loại "Phạt"
create function settle_payment_intent(p_intent_id uuid, p_event_id uuid, p_actor uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  i payment_intents;
  v_account uuid;
begin
  select * into i from payment_intents where id = p_intent_id for update;
  if not found or i.status = 'paid' then
    return false;
  end if;

  update penalties
  set status = 'paid', paid_at = now(), paid_method = case i.method when 'cash' then 'cash' else 'vietqr' end,
      payment_ref = i.ref, confirmed_by = p_actor
  where id = any (i.penalty_ids) and status = 'unpaid';

  update payment_intents set status = 'paid', paid_at = now(), bank_event_id = p_event_id where id = i.id;

  if p_event_id is not null then
    update fund_transactions
    set category_id = fund_category_id('in', 'Phạt'), member_id = i.member_id, intent_id = i.id,
        description = 'Nộp phạt ' || i.ref
    where bank_event_id = p_event_id and direction = 'in';
  else
    select id into v_account from fund_accounts where kind = 'cash' and active order by created_at limit 1;
    insert into fund_transactions (account_id, direction, amount, category_id, description, member_id, intent_id, created_by)
    values (v_account, 'in', i.amount, fund_category_id('in', 'Phạt'), 'Nộp phạt tiền mặt ' || i.ref, i.member_id, i.id, p_actor);
  end if;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (p_actor, 'settle_payment_intent', 'payment_intents', i.id::text, null,
    jsonb_build_object('ref', i.ref, 'amount', i.amount, 'event_id', p_event_id));
  return true;
end;
$$;

revoke execute on function settle_payment_intent(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function settle_payment_intent(uuid, uuid, uuid) to service_role;

-- Ghi webhook và giao dịch quỹ trong một transaction; gửi lại cùng mã giao dịch thì không ghi thêm
create function record_bank_event(
  p_provider text, p_txn_id text, p_direction text, p_amount bigint, p_content text,
  p_account_no text, p_transferred_at timestamptz, p_raw jsonb
)
returns table (event_id uuid, is_new boolean, processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_account uuid;
begin
  insert into bank_webhook_events (provider, provider_txn_id, direction, amount, content, account_no, transferred_at, raw)
  values (p_provider, p_txn_id, p_direction, p_amount, p_content, p_account_no, p_transferred_at, p_raw)
  on conflict (provider, provider_txn_id) do nothing
  returning id into v_id;

  if v_id is null then
    return query
      select e.id, false, e.processed_at is not null
      from bank_webhook_events e where e.provider = p_provider and e.provider_txn_id = p_txn_id;
    return;
  end if;

  select id into v_account from fund_accounts
  where kind = 'bank' and active
  order by (account_no = p_account_no) desc nulls last, created_at
  limit 1;

  insert into fund_transactions (account_id, direction, amount, category_id, occurred_at, description, bank_event_id)
  values (v_account, p_direction, p_amount, fund_category_id(p_direction, 'Khác'), p_transferred_at,
    left(p_content, 300), v_id);

  return query select v_id, true, false;
end;
$$;

revoke execute on function record_bank_event(text, text, text, bigint, text, text, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function record_bank_event(text, text, text, bigint, text, text, timestamptz, jsonb) to service_role;

-- Kết quả đối soát của một webhook (do hàm thuần match.ts quyết định)
create function finish_bank_event(p_event_id uuid, p_status text, p_intent_id uuid, p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status = 'paid' then
    perform settle_payment_intent(p_intent_id, p_event_id, null);
  elsif p_status = 'mismatch' then
    update payment_intents set status = 'mismatch' where id = p_intent_id and status in ('pending', 'expired');
  end if;
  update bank_webhook_events
  set match_status = p_status, matched_intent_id = p_intent_id, suggested_member_id = p_member_id, processed_at = now()
  where id = p_event_id;
end;
$$;

revoke execute on function finish_bank_event(uuid, text, uuid, uuid) from public, anon, authenticated;
grant execute on function finish_bank_event(uuid, text, uuid, uuid) to service_role;

-- Thủ quỹ ghép tay một giao dịch ngân hàng với lần nộp (kể cả khi lệch tiền)
create function resolve_bank_event(p_event_id uuid, p_intent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if not exists (select 1 from bank_webhook_events where id = p_event_id and direction = 'in') then
    raise exception 'Không tìm thấy giao dịch';
  end if;
  perform settle_payment_intent(p_intent_id, p_event_id, auth.uid());
  update bank_webhook_events set match_status = 'resolved', matched_intent_id = p_intent_id where id = p_event_id;
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'resolve_bank_event', 'bank_webhook_events', p_event_id::text, null,
    jsonb_build_object('intent_id', p_intent_id));
end;
$$;

create function confirm_cash_payment(p_intent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if not exists (select 1 from payment_intents where id = p_intent_id and method = 'cash' and status = 'cash_pending') then
    raise exception 'Không có yêu cầu nộp tiền mặt này';
  end if;
  perform settle_payment_intent(p_intent_id, null, auth.uid());
end;
$$;

create function cancel_payment_intent(p_intent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update payment_intents set status = 'cancelled'
  where id = p_intent_id and status in ('pending', 'cash_pending', 'mismatch')
    and (member_id = auth.uid() or can_manage_fund());
end;
$$;

create function add_fund_transaction(
  p_account_id uuid, p_direction text, p_amount bigint, p_category_id uuid, p_occurred_at timestamptz,
  p_description text, p_member_id uuid, p_event_id uuid, p_receipt_url text
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
  insert into fund_transactions (account_id, direction, amount, category_id, occurred_at, description, member_id, event_id, receipt_url, created_by)
  values (p_account_id, p_direction, p_amount, p_category_id, p_occurred_at, coalesce(p_description, ''), p_member_id, p_event_id,
    nullif(btrim(p_receipt_url), ''), auth.uid())
  returning id into v_id;
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'add_fund_transaction', 'fund_transactions', v_id::text, null,
    jsonb_build_object('direction', p_direction, 'amount', p_amount));
  return v_id;
end;
$$;

create function void_fund_transaction(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update fund_transactions set voided_at = now(), void_reason = btrim(p_reason) where id = p_id and voided_at is null;
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'void_fund_transaction', 'fund_transactions', p_id::text, null, jsonb_build_object('reason', p_reason));
end;
$$;

create function classify_fund_transaction(p_id uuid, p_category_id uuid, p_member_id uuid, p_description text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  update fund_transactions
  set category_id = p_category_id, member_id = p_member_id, description = coalesce(p_description, description)
  where id = p_id and voided_at is null;
  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), 'classify_fund_transaction', 'fund_transactions', p_id::text, null,
    jsonb_build_object('category_id', p_category_id, 'member_id', p_member_id));
end;
$$;

-- Đối chiếu số dư theo sao kê: app_balance tính tới hết ngày as_of (giờ Việt Nam)
create function record_fund_reconciliation(p_account_id uuid, p_as_of date, p_statement_balance bigint, p_note text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app bigint;
begin
  if not can_manage_fund() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  select coalesce(sum(case when direction = 'in' then amount else -amount end), 0)::bigint into v_app
  from fund_transactions
  where account_id = p_account_id and voided_at is null
    and occurred_at < ((p_as_of + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh');
  insert into fund_reconciliations (account_id, as_of, statement_balance, app_balance, difference, note, created_by)
  values (p_account_id, p_as_of, p_statement_balance, v_app, p_statement_balance - v_app, coalesce(p_note, ''), auth.uid());
  return p_statement_balance - v_app;
end;
$$;

revoke execute on function resolve_bank_event(uuid, uuid) from public, anon;
revoke execute on function confirm_cash_payment(uuid) from public, anon;
revoke execute on function cancel_payment_intent(uuid) from public, anon;
revoke execute on function add_fund_transaction(uuid, text, bigint, uuid, timestamptz, text, uuid, uuid, text) from public, anon;
revoke execute on function void_fund_transaction(uuid, text) from public, anon;
revoke execute on function classify_fund_transaction(uuid, uuid, uuid, text) from public, anon;
revoke execute on function record_fund_reconciliation(uuid, date, bigint, text) from public, anon;
grant execute on function resolve_bank_event(uuid, uuid) to authenticated;
grant execute on function confirm_cash_payment(uuid) to authenticated;
grant execute on function cancel_payment_intent(uuid) to authenticated;
grant execute on function add_fund_transaction(uuid, text, bigint, uuid, timestamptz, text, uuid, uuid, text) to authenticated;
grant execute on function void_fund_transaction(uuid, text) to authenticated;
grant execute on function classify_fund_transaction(uuid, uuid, uuid, text) to authenticated;
grant execute on function record_fund_reconciliation(uuid, date, bigint, text) to authenticated;
