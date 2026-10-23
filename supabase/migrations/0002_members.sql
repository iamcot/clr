create sequence member_code_seq start 1;

create table members (
  id uuid primary key references auth.users (id) on delete cascade,
  strava_athlete_id bigint unique not null,
  display_name text,
  avatar_url text,
  gender text check (gender in ('M', 'F', 'X')),
  birth_year int,
  city text,
  phone text,
  role text not null default 'guest' check (role in ('guest', 'member', 'bcn', 'treasurer')),
  member_type text check (member_type in ('official', 'free')),
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive', 'rejected')),
  member_code text unique not null default ('CLR' || lpad(nextval('member_code_seq')::text, 4, '0')),
  share_private_in_totals boolean not null default false,
  strava_connected boolean not null default true,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger members_set_updated_at
  before update on members
  for each row execute function set_updated_at();

create table strava_tokens (
  member_id uuid primary key references members (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text not null,
  updated_at timestamptz not null default now()
);

create trigger strava_tokens_set_updated_at
  before update on strava_tokens
  for each row execute function set_updated_at();

create function is_bcn()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members where id = auth.uid() and role = 'bcn' and status = 'active'
  );
$$;

create function is_treasurer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members where id = auth.uid() and role = 'treasurer' and status = 'active'
  );
$$;

-- Thành viên chỉ được sửa cột hồ sơ của mình; cột quyền hạn chỉ BCN (hoặc service role, auth.uid() là null) được đổi.
create function members_guard_privileged_columns()
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
  then
    raise exception 'Không có quyền sửa cột này' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger members_guard_privileged_columns
  before update on members
  for each row execute function members_guard_privileged_columns();

alter table members enable row level security;
alter table strava_tokens enable row level security;

create policy members_select_self_or_bcn on members
  for select
  to authenticated
  using (id = (select auth.uid()) or is_bcn());

create policy members_update_self on members
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy members_update_bcn on members
  for update
  to authenticated
  using (is_bcn())
  with check (is_bcn());

-- strava_tokens không có policy nào: chỉ service role đọc/ghi.

create view members_public as
  select id, display_name, avatar_url, member_type, gender
  from members
  where status = 'active';

revoke all on members_public from anon;
grant select on members_public to authenticated;

insert into settings (key, value) values
  ('zalo_group_url', '""')
on conflict (key) do nothing;

create policy settings_write_bcn on settings
  for all
  to authenticated
  using (is_bcn())
  with check (is_bcn());
