create extension if not exists pgcrypto with schema extensions;

-- Khoá bí mật của từng event dùng ký mã điểm danh; bật RLS và không có policy nên chỉ hàm security definer đọc được
create table event_secrets (
  event_id uuid primary key references events (id) on delete cascade,
  checkin_secret text not null default gen_random_uuid()::text
);

alter table event_secrets enable row level security;

insert into event_secrets (event_id) select id from events;

create function create_event_secret()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into event_secrets (event_id) values (new.id);
  return new;
end;
$$;

create trigger events_create_secret
  after insert on events
  for each row execute function create_event_secret();

create function event_checkin_period_s()
returns int
language sql
immutable
as $$ select 30; $$;

create function checkin_code_for_slot(p_event_id uuid, p_slot bigint)
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select substr(encode(hmac(p_slot::text, checkin_secret, 'sha256'), 'hex'), 1, 12)
  from event_secrets where event_id = p_event_id;
$$;

revoke execute on function checkin_code_for_slot(uuid, bigint) from public, anon, authenticated;

-- Mã đổi mỗi event_checkin_period_s giây; trả kèm số giây còn hiệu lực để màn BCN tự làm mới
create function event_checkin_code(p_event_id uuid)
returns table (code text, expires_in_s int)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_period int := event_checkin_period_s();
  v_epoch bigint := floor(extract(epoch from now()));
begin
  if not is_bcn() then
    raise exception 'not_bcn';
  end if;
  return query select checkin_code_for_slot(p_event_id, v_epoch / v_period), (v_period - (v_epoch % v_period))::int;
end;
$$;

grant execute on function event_checkin_code(uuid) to authenticated;

-- Chấp nhận mã của khoảng hiện tại và khoảng liền trước nên link dùng được tối đa 2 × event_checkin_period_s giây
create function self_check_in(p_event_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot bigint := floor(extract(epoch from now()) / event_checkin_period_s())::bigint;
  v_already timestamptz;
begin
  if not is_active_member() then
    raise exception 'not_member';
  end if;
  if not exists (select 1 from events where id = p_event_id and status = 'published') then
    raise exception 'event_not_open';
  end if;
  if p_code is distinct from checkin_code_for_slot(p_event_id, v_slot)
    and p_code is distinct from checkin_code_for_slot(p_event_id, v_slot - 1) then
    raise exception 'code_expired';
  end if;

  select checked_in_at into v_already from event_attendees where event_id = p_event_id and member_id = auth.uid();
  if v_already is not null then
    return 'already';
  end if;

  insert into event_attendees (event_id, member_id, status, checked_in_at, checked_in_by)
  values (p_event_id, auth.uid(), 'going', now(), auth.uid())
  on conflict (event_id, member_id) do update
    set status = 'going', checked_in_at = now(), checked_in_by = auth.uid(), status_changed_at = now();
  return 'checked_in';
end;
$$;

grant execute on function self_check_in(uuid, text) to authenticated;
