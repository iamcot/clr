create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target_table text not null,
  target_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_target_idx on audit_logs (target_table, target_id);
create index audit_logs_created_at_idx on audit_logs (created_at desc);

alter table settings enable row level security;
alter table audit_logs enable row level security;

-- Cấu hình CLB là thông tin công khai. Ghi qua service role cho tới khi có bảng members (task 2.1) để viết policy BCN.
create policy settings_read_all on settings
  for select
  to anon, authenticated
  using (true);

-- audit_logs chưa có policy: chỉ service role đọc/ghi. Policy cho BCN thêm ở migration của task 4.1.
