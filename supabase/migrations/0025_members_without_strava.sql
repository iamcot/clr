-- Tài khoản admin riêng (đăng nhập bằng tên + mật khẩu) không có Strava. unique vẫn cho nhiều dòng null.
alter table members alter column strava_athlete_id drop not null;
