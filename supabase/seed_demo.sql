-- Dữ liệu giả để xem giao diện (xếp hạng, bảng vàng, challenge). KHÔNG tự chạy theo migration.
-- Chạy trong SQL Editor của Supabase. Tất cả thành viên giả có email demo+N@clr.local và strava_athlete_id âm;
-- gỡ sạch bằng supabase/seed_demo_cleanup.sql.

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'demo+' || n || '@clr.local', now(), now()
from generate_series(1, 12) as n
on conflict (id) do nothing;

insert into members (
  id, strava_athlete_id, display_name, gender, birth_year, city, role, member_type, status,
  share_stats_with_club, joined_at
)
select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  -n,
  (array['Nguyễn Minh Anh', 'Trần Quốc Bảo', 'Lê Thu Hà', 'Phạm Đức Huy', 'Võ Khánh Linh', 'Đặng Hoàng Nam',
    'Bùi Ngọc Mai', 'Hoàng Gia Phúc', 'Đỗ Thanh Tâm', 'Ngô Anh Tuấn', 'Lý Bảo Châu', 'Vũ Tuấn Kiệt'])[n],
  case when n % 2 = 0 then 'M' else 'F' end,
  1980 + n,
  'Hồ Chí Minh',
  'member',
  case when n % 4 = 0 then 'free' else 'official' end,
  'active',
  true,
  now() - (n * interval '20 days')
from generate_series(1, 12) as n
on conflict (id) do nothing;

-- Mỗi người 24 buổi chạy rải trong 60 ngày gần nhất, người số nhỏ chạy nhiều hơn
insert into activities (
  id, member_id, name, sport_type, start_date, start_date_local, distance_m, moving_time_s, elapsed_time_s,
  elevation_gain_m, detail_fetched
)
select -(n * 1000 + k),
  ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'Chạy demo',
  'Run',
  now() - (k * 2.5 * interval '1 day') - interval '6 hours',
  (now() - (k * 2.5 * interval '1 day') - interval '6 hours') at time zone 'Asia/Ho_Chi_Minh',
  (5000 + ((n * 37 + k * 211) % 7000) + (13 - n) * 150)::int,
  ((5000 + ((n * 37 + k * 211) % 7000) + (13 - n) * 150) * (0.28 + n * 0.01))::int,
  ((5000 + ((n * 37 + k * 211) % 7000) + (13 - n) * 150) * (0.29 + n * 0.01))::int,
  20 + (k % 5) * 10,
  true
from generate_series(1, 12) as n, generate_series(1, 24) as k
on conflict (id) do nothing;

insert into races (id, name, race_date, city, organizer)
values
  ('00000000-0000-4000-9000-000000000001', 'VnExpress Marathon Hồ Chí Minh', current_date - 120, 'Hồ Chí Minh', 'VnExpress'),
  ('00000000-0000-4000-9000-000000000002', 'Giải chạy Cầu Rồng Đà Nẵng', current_date - 60, 'Đà Nẵng', 'Sở Du lịch'),
  ('00000000-0000-4000-9000-000000000003', 'Dalat Ultra Trail 10K', current_date - 20, 'Đà Lạt', 'Dalat UT')
on conflict (id) do nothing;

-- Kết quả đã xác minh (verified_at có giá trị); mỗi thành viên một kết quả, số thứ tự thành viên là hậu tố id
insert into race_results (
  id, member_id, race_id, distance_label, distance_m, chip_time_s, rank_overall, rank_age_group, verified_at
)
select ('00000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid, member_n_id, race_id, label,
  distance, chip_time, overall, age_group, now()
from (
  select n, ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid as member_n_id,
    race_id, label, distance, chip_time, overall, age_group
  from (values
    (1, '00000000-0000-4000-9000-000000000001'::uuid, 'Marathon', 42195, 11400, 2, 1),
    (3, '00000000-0000-4000-9000-000000000001'::uuid, 'Marathon', 42195, 13200, 40, 3),
    (2, '00000000-0000-4000-9000-000000000001'::uuid, 'Marathon', 42195, 14100, 8, 1),
    (4, '00000000-0000-4000-9000-000000000002'::uuid, 'Half Marathon', 21097, 5400, 3, 1),
    (5, '00000000-0000-4000-9000-000000000002'::uuid, 'Half Marathon', 21097, 5700, 25, 2),
    (6, '00000000-0000-4000-9000-000000000002'::uuid, 'Half Marathon', 21097, 6300, 12, 2),
    (7, '00000000-0000-4000-9000-000000000002'::uuid, 'Half Marathon', 21097, 6900, 80, 9),
    (8, '00000000-0000-4000-9000-000000000003'::uuid, '10K', 10000, 2520, 10, 1),
    (9, '00000000-0000-4000-9000-000000000003'::uuid, '10K', 10000, 2700, 30, 4),
    (10, '00000000-0000-4000-9000-000000000003'::uuid, '10K', 10000, 3000, 45, 8),
    (11, '00000000-0000-4000-9000-000000000003'::uuid, '5K', 5000, 1260, 5, 2),
    (12, '00000000-0000-4000-9000-000000000003'::uuid, '5K', 5000, 1500, 20, 6)
  ) as data (n, race_id, label, distance, chip_time, overall, age_group)
) as rows
on conflict (id) do nothing;

-- Một challenge đã chốt để có danh hiệu vô địch
insert into challenges (id, title, starts_at, ends_at, goal_type, status, closed_at)
values ('00000000-0000-4000-b000-000000000001', 'Challenge 100K tháng trước', now() - interval '45 days',
  now() - interval '15 days', 'total_distance', 'closed', now() - interval '14 days')
on conflict (id) do nothing;

insert into challenge_categories (id, challenge_id, name, goal_value)
values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-b000-000000000001', 'Chung', 100000)
on conflict (id) do nothing;

insert into challenge_entries (challenge_id, member_id, category_id, value, progress_pct, completed, rank)
select '00000000-0000-4000-b000-000000000001',
  ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-4000-b000-000000000002',
  (150000 - n * 9000), least(100, (150000 - n * 9000) / 1000.0), (150000 - n * 9000) >= 100000, n
from generate_series(1, 12) as n
on conflict (challenge_id, member_id) do nothing;

select refresh_all_member_stats();

-- Bật bảng xếp hạng cho thành viên (tạm thời, để xem giao diện và chụp ảnh gửi Strava)
insert into settings (key, value) values ('club_display_mode', '"full_opt_in"')
on conflict (key) do update set value = excluded.value;
