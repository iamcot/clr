alter table members add column rejection_reason text;

-- Thêm rejection_reason vào nhóm cột chỉ BCN được sửa.
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
  then
    raise exception 'Không có quyền sửa cột này' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace view members_public as
  select id, display_name, avatar_url, member_type, gender, joined_at
  from members
  where status = 'active';

create policy audit_logs_select_bcn on audit_logs
  for select
  to authenticated
  using (is_bcn());

-- Ghi audit_logs: BCN không có policy insert, chỉ ghi qua các hàm security definer dưới đây.
create function log_audit(p_action text, p_target_table text, p_target_id text, p_before jsonb, p_after jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_before, p_after);
end;
$$;

revoke execute on function log_audit(text, text, text, jsonb, jsonb) from public, anon;
grant execute on function log_audit(text, text, text, jsonb, jsonb) to authenticated;

-- Duyệt hoặc từ chối nhiều người đang chờ một lúc; trả về số người được xử lý.
create function admin_review_members(p_member_ids uuid[], p_approve boolean, p_member_type text, p_reason text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  target members%rowtype;
  reviewed_count int := 0;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;
  if p_approve and coalesce(p_member_type, '') not in ('official', 'free') then
    raise exception 'Cần chọn loại thành viên';
  end if;
  if not p_approve and coalesce(btrim(p_reason), '') = '' then
    raise exception 'Cần nhập lý do từ chối';
  end if;

  for target in select * from members where id = any (p_member_ids) and status = 'pending' for update loop
    if p_approve then
      update members
      set status = 'active',
          role = case when role = 'guest' then 'member' else role end,
          member_type = p_member_type,
          joined_at = coalesce(joined_at, now()),
          rejection_reason = null
      where id = target.id;
    else
      update members set status = 'rejected', rejection_reason = btrim(p_reason) where id = target.id;
    end if;

    insert into audit_logs (actor_id, action, target_table, target_id, before, after)
    values (
      auth.uid(),
      case when p_approve then 'approve_member' else 'reject_member' end,
      'members',
      target.id::text,
      jsonb_build_object('status', target.status, 'member_type', target.member_type),
      case when p_approve
        then jsonb_build_object('status', 'active', 'member_type', p_member_type)
        else jsonb_build_object('status', 'rejected', 'rejection_reason', btrim(p_reason))
      end
    );
    reviewed_count := reviewed_count + 1;
  end loop;

  return reviewed_count;
end;
$$;

revoke execute on function admin_review_members(uuid[], boolean, text, text) from public, anon;
grant execute on function admin_review_members(uuid[], boolean, text, text) to authenticated;

-- Đổi loại, vai trò, trạng thái của một thành viên. BCN không tự đổi vai trò hoặc trạng thái của mình.
create function admin_update_member(p_member_id uuid, p_member_type text, p_role text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target members%rowtype;
begin
  if not is_bcn() then
    raise exception 'Không có quyền' using errcode = '42501';
  end if;

  select * into target from members where id = p_member_id for update;
  if not found then
    raise exception 'Không tìm thấy thành viên';
  end if;
  if p_member_id = auth.uid() and (p_role <> target.role or p_status <> target.status) then
    raise exception 'Không tự đổi vai trò hoặc trạng thái của chính mình';
  end if;
  if p_status = 'active' and (p_role = 'guest' or p_member_type is null) then
    raise exception 'Thành viên đang hoạt động cần có loại và vai trò';
  end if;

  update members
  set member_type = p_member_type,
      role = p_role,
      status = p_status,
      joined_at = case when p_status = 'active' then coalesce(joined_at, now()) else joined_at end,
      rejection_reason = case when p_status = 'active' then null else rejection_reason end
  where id = p_member_id;

  insert into audit_logs (actor_id, action, target_table, target_id, before, after)
  values (
    auth.uid(),
    'update_member',
    'members',
    p_member_id::text,
    jsonb_build_object('member_type', target.member_type, 'role', target.role, 'status', target.status),
    jsonb_build_object('member_type', p_member_type, 'role', p_role, 'status', p_status)
  );
end;
$$;

revoke execute on function admin_update_member(uuid, text, text, text) from public, anon;
grant execute on function admin_update_member(uuid, text, text, text) to authenticated;

create table follows (
  follower_id uuid not null references members (id) on delete cascade,
  followee_id uuid not null references members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on follows (followee_id);

alter table follows enable row level security;

create policy follows_select_all on follows
  for select
  to authenticated
  using (true);

create policy follows_insert_self on follows
  for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and exists (select 1 from members where id = follower_id and status = 'active')
    and exists (select 1 from members_public where id = followee_id)
  );

create policy follows_delete_self on follows
  for delete
  to authenticated
  using (follower_id = (select auth.uid()));
