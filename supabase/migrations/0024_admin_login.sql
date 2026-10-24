-- Tài khoản đăng nhập admin bằng tên + mật khẩu cho thành viên BCN. Mật khẩu nằm ở auth.users,
-- bảng này chỉ giữ tên đăng nhập. Chỉ service role ghi (BCN tạo qua server action), không có đăng ký tự do.
create table admin_logins (
  member_id uuid primary key references members(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table admin_logins enable row level security;

create policy admin_logins_select_bcn on admin_logins
  for select
  to authenticated
  using (is_bcn());
