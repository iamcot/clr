# 07 – Challenge và bảng xếp hạng ⚠️

Mục tiêu: BCN tạo challenge (hàng tháng hoặc theo khoảng thời gian), thành viên tham gia, kết quả tự tính từ Strava, bảng xếp hạng cập nhật gần như ngay, cuối kỳ tự chốt, tự sinh thưởng/phạt.

Phụ thuộc: 03 (activities hợp lệ), 04 (loại thành viên). Kết thúc kỳ gọi sang 08.

Thứ tự: 7.1 → 7.2 → 7.3 → 7.4 → 7.5 → 7.6.

---

## Luật challenge (dạng cấu hình, không hardcode)

Một challenge có:
- `title`, `description`, `cover_url`, `starts_at`, `ends_at` (giờ VN, ví dụ 01/11 00:00 → 30/11 23:59:59).
- `goal_type`:
  - `total_distance` – tổng km trong kỳ ≥ mục tiêu
  - `active_days` – số ngày có chạy ≥ mục tiêu
  - `activity_count` – số buổi ≥ mục tiêu
  - `total_elevation` – tổng độ cao ≥ mục tiêu
  - `single_distance` – có ít nhất một buổi ≥ X km (ví dụ challenge "chạy 1 lần 21K")
- `goal_value` (số), có thể khác nhau theo **hạng mục** (`challenge_categories`: ví dụ Nam 100 km, Nữ 80 km; hoặc Cơ bản 50 km / Nâng cao 150 km cho thành viên tự chọn).
- Điều kiện mỗi buổi được tính (`activity_filter` jsonb): `min_distance_m` (ví dụ ≥ 2 km mới tính), `max_pace_s_per_km` (chậm hơn ngưỡng không tính, ví dụ đi bộ), `min_pace_s_per_km`, `sport_types`, `max_distance_per_day_m` (chặn ngày chạy 50 km dồn chỉ tiêu), `time_window` (ví dụ chỉ tính buổi sáng 4:00–9:00).
- `participation`: `mandatory_official` (tự ghi danh mọi thành viên chính thức), `opt_in` (tự đăng ký), `invite` (BCN chọn).
- `registration_closes_at` (sau thời điểm này không đăng ký thêm).
- `ranking`: sắp xếp theo `value desc` (mặc định), hoặc `completed_at asc` (ai xong trước hạng trên).
- `penalty_rule` và `reward_rule` (xem 08): ví dụ không đạt phạt 100.000đ, đạt dưới 50% phạt 200.000đ; top 3 mỗi hạng mục được thưởng.
- `status`: `draft` / `published` / `running` / `finalizing` / `closed`.

---

## Task 7.1 – Schema

Làm (migration mới):
- `challenges` theo luật trên.
- `challenge_categories (id, challenge_id, name, goal_value, gender null, member_type null, sort)`.
- `challenge_entries (challenge_id, member_id, category_id, joined_at, value numeric, progress_pct numeric, completed bool, completed_at timestamptz null, rank int, last_activity_at, excluded bool default false, excluded_reason text, pk(challenge_id, member_id))`.
- `challenge_entry_activities (challenge_id, member_id, activity_id, counted_value numeric)` để giải thích "buổi nào được tính, tính bao nhiêu".
- RLS: thành viên active đọc challenge `published+`; đọc entries của mọi người (tuân theo quyền chia sẻ ở 3.0); tự `insert` entry của mình khi `opt_in` và còn hạn đăng ký; BCN toàn quyền.

Nghiệm thu:
- [ ] Member không tạo được challenge, không sửa được entry người khác.

---

## Task 7.2 – Tính kết quả ⚠️

Làm:
- `src/lib/challenges/score.ts` (hàm thuần): nhận challenge + category + danh sách activity của một người → `{ value, completed, completedAt, countedActivities[] }`. Áp đủ `activity_filter`, `max_distance_per_day_m` (cắt phần dư), `time_window` theo giờ VN.
- Test bắt buộc:
  - buổi 1,8 km khi `min_distance_m = 2000` → không tính
  - ngày chạy 30 km khi `max_distance_per_day_m = 21000` → tính 21 km
  - buổi bắt đầu 23:50 ngày cuối kỳ → tính; 00:05 ngày sau kỳ → không tính
  - `active_days`: hai buổi cùng ngày = 1 ngày
  - `completed_at` = thời điểm kết thúc buổi làm đủ chỉ tiêu
- Hàm server `recomputeChallengeEntry(challengeId, memberId)` dùng `score.ts`, ghi `challenge_entries` + `challenge_entry_activities`, rồi tính lại `rank` cả challenge (một câu SQL `rank() over`).
- Gắn vào hook sau upsert/xoá activity (3.3): tìm challenge đang `running` mà người đó tham gia và ngày hoạt động nằm trong kỳ.
- Hoạt động sửa/xoá sau khi challenge đã `closed` → không tính lại (kết quả đã chốt), ghi log.

Nghiệm thu:
- [ ] Toàn bộ test trên pass.
- [ ] Chạy một buổi thật → tiến độ challenge tháng của mình tăng trong ≤ 2 phút.

---

## Task 7.3 – Admin tạo và quản lý challenge

Làm:
- `/admin/challenges`: danh sách theo trạng thái. Tạo/sửa bằng form từng bước: Thông tin → Mục tiêu & hạng mục → Điều kiện buổi chạy → Tham gia → Thưởng/phạt → Xem lại.
- **Nhân bản** challenge (tạo challenge tháng sau từ tháng này, tự dời ngày).
- Mẫu nhanh: "Challenge tháng chuẩn" lấy từ `settings` (BCN lưu một lần).
- Publish → `mandatory_official` thì tự tạo entries cho mọi thành viên chính thức active (và người được duyệt chính thức giữa kỳ cũng tự vào).
- Trong kỳ: BCN loại một người (`excluded` + lý do), chuyển hạng mục, thêm người.
- Sửa luật khi challenge đang chạy → cảnh báo + nút "Tính lại tất cả".

Nghiệm thu:
- [ ] Tạo challenge "Tháng 11 – 100K" bắt buộc chính thức: mọi thành viên chính thức có entry, tiến độ đúng với hoạt động từ ngày 1.
- [ ] Nhân bản sang tháng 12: ngày, hạng mục, luật đúng; trạng thái `draft`.

---

## Task 7.4 – Màn challenge cho thành viên

Làm (theo màn "Challenge & BXH" của mockup):
- `/challenges`: Đang diễn ra (thẻ có thanh tiến độ của mình), Sắp tới (nút Tham gia), Đã kết thúc (kết quả của mình: Hoàn thành / Không đạt).
- `/challenges/[id]`: luật hiển thị dễ hiểu (sinh từ cấu hình: "Mỗi buổi ≥ 2 km, pace nhanh hơn 9:00/km, tối đa 21 km/ngày"), tiến độ của mình (số + %, còn bao nhiêu, còn mấy ngày, cần trung bình bao nhiêu km/ngày), danh sách buổi được tính và **buổi bị loại kèm lý do**.
- Bảng xếp hạng theo hạng mục: hạng, tên, giá trị, %, dấu ✓ khi hoàn thành. Dòng của mình ghim. Lọc "Người tôi theo dõi".
- Realtime: bảng xếp hạng tự cập nhật bằng Supabase Realtime (subscribe `challenge_entries` theo `challenge_id`), không cần kéo tải lại.

Nghiệm thu:
- [ ] Mở bảng xếp hạng trên 2 điện thoại; một người có buổi chạy mới → máy kia thấy số đổi không cần tải lại.
- [ ] Buổi bị loại hiện lý do đúng (ví dụ "Ngắn hơn 2 km").

---

## Task 7.5 – Chốt kỳ

Làm:
- Job `pg_cron` mỗi 15 phút: challenge `running` đã quá `ends_at` + **thời gian ân hạn** (mặc định 48 giờ, trong `settings`, để người chạy tối cuối kỳ kịp đồng bộ) → `finalizing`: tính lại toàn bộ lần cuối.
- BCN xem kết quả ở `/admin/challenges/[id]/results`, sửa tay nếu cần (ghi audit), bấm **Chốt kết quả** → `closed`, gọi sinh thưởng/phạt (08), tạo bài thông báo kết quả (10, nếu đã có).
- Xuất CSV kết quả.

Nghiệm thu:
- [ ] Challenge hết hạn → chuyển `finalizing` sau ân hạn; chưa chốt thì chưa có phạt.
- [ ] Chốt → mỗi người không đạt có đúng một khoản phạt; chốt lại lần nữa không nhân đôi.

---

## Task 7.6 – Phân loại, sắp xếp, tổng hợp

Làm:
- `/admin/challenges/summary`: tổng hợp nhiều kỳ: mỗi thành viên đã tham gia bao nhiêu challenge, hoàn thành bao nhiêu, chuỗi tháng hoàn thành liên tiếp. Lọc theo năm, loại thành viên. Sắp xếp theo cột.
- Số liệu này cấp cho 06 (khối challenge ở thống kê cá nhân, điểm CLB) và 12 (bảng vàng).

Nghiệm thu:
- [ ] Với dữ liệu seed 3 tháng: tổng hợp khớp đếm tay của 3 người bất kỳ.

---

## Câu hỏi cho BCN
- Challenge tháng hiện tại của CLB có luật cụ thể thế nào (km, điều kiện mỗi buổi, có chia Nam/Nữ)? Gửi luật tháng gần nhất để làm mẫu.
- Thời gian ân hạn sau kỳ bao lâu là hợp lý?
- Có loại challenge **theo đội** (cộng km cả đội) không?
