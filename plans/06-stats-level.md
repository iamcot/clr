# 06 – Thống kê cá nhân, level, xếp hạng CLB

Mục tiêu: số hoạt động, km, pace, thời gian chạy theo tuần/tháng/năm; level để xếp hạng trong CLB; số challenge tham gia/hoàn thành, số lần và số tiền phạt.

Phụ thuộc: 03 (có `activities.counts_for_club`), task 3.0 đã chốt cách hiển thị.

Thứ tự: 6.1 → 6.2 → 6.3 → 6.4.

---

## Task 6.1 – Bảng tổng hợp

Làm (migration mới):
- `member_stats_period`: `member_id`, `period_type` (`week`/`month`/`year`/`all`), `period_start date` (tuần bắt đầu thứ Hai, theo giờ Việt Nam), `activity_count int`, `distance_m bigint`, `moving_time_s bigint`, `elevation_gain_m numeric`, `longest_m int`, `active_days int`, `updated_at`; pk `(member_id, period_type, period_start)`.
- Hàm SQL `refresh_member_stats(member_id, from_date)` tính lại các kỳ bị ảnh hưởng. Gọi từ hook sau khi upsert/xoá activity (task 3.3) và khi đổi `counts_for_club`.
- Chỉ tính hoạt động `counts_for_club = true`; hoạt động riêng tư chỉ tính khi `share_private_in_totals = true`.
- Job đêm (`pg_cron` 02:00 giờ VN) tính lại toàn bộ tháng hiện tại cho mọi người để chữa lệch.

Nghiệm thu:
- [ ] Thêm/xoá một hoạt động trên Strava → tổng tuần/tháng/năm đổi đúng trong ≤ 2 phút.
- [ ] Một hoạt động lúc 23:30 Chủ nhật giờ VN thuộc tuần đó, không nhảy sang tuần sau (test SQL hoặc test hàm `weekStartVN`).

---

## Task 6.2 – Level ⚠️ (công thức cần BCN chốt)

Làm:
- `src/config/levels.ts`: danh sách level, ví dụ (**quyết định tạm**, BCN sửa số):

| Level | Tên | Điều kiện (12 tháng gần nhất) |
|---|---|---|
| 1 | Tân binh | mới vào |
| 2 | Chăm chỉ | ≥ 300 km và ≥ 50 ngày chạy |
| 3 | Bền bỉ | ≥ 800 km và ≥ 100 ngày chạy |
| 4 | Chiến binh | ≥ 1.500 km và ≥ 150 ngày chạy, có PR HM |
| 5 | Huyền thoại | ≥ 2.500 km và ≥ 200 ngày chạy, có PR FM |

- Ngoài level còn **điểm CLB** (`club_points`) để xếp hạng trong cùng level: `km × 1 + ngày chạy × 2 + challenge hoàn thành × 50` (hệ số trong config).
- `src/lib/stats/level.ts`: `computeLevel(stats, prs, config)` và `computeClubPoints(...)` thuần + test đủ ranh giới.
- Lưu vào `members.level`, `members.club_points`, `members.level_updated_at`; tính lại mỗi đêm và khi tổng hợp thay đổi. Lên level → tạo thông báo (dùng ở 10/14).

Nghiệm thu:
- [ ] Test: đúng ngưỡng 300 km + 50 ngày → level 2; 299,9 km → level 1.
- [ ] Đổi số trong `levels.ts` + chạy hàm tính lại → level mọi người cập nhật.

---

## Task 6.3 – Màn thống kê cá nhân

Làm:
- `/me/stats`: chọn Tuần / Tháng / Năm. Hiện: số buổi, km, thời gian, pace TB, độ cao, buổi dài nhất, số ngày chạy, chuỗi ngày chạy liên tiếp dài nhất.
- Biểu đồ cột km theo tuần (12 tuần) / theo tháng (12 tháng) bằng SVG tự vẽ (không thêm thư viện biểu đồ).
- So với kỳ trước (+12% so với tháng trước).
- Khối Challenge & phạt: số challenge đã tham gia, hoàn thành, tỉ lệ; số lần bị phạt, tổng tiền phạt, còn nợ (dữ liệu từ 07, 08; hiện "—" nếu chưa có).

Nghiệm thu:
- [ ] Số km tháng khớp tổng tay từ danh sách hoạt động tháng đó.
- [ ] Biểu đồ đọc được trên 360px, chạm vào cột hiện số.

---

## Task 6.4 – Xếp hạng CLB

Làm:
- `/rankings`: tab **Tháng này / Năm nay / Level**. Lọc theo giới tính, loại thành viên.
- Mỗi dòng: hạng, ảnh, tên, level, km (hoặc điểm CLB ở tab Level). Người không chia sẻ số liệu: hiện theo cách đã chốt ở task 3.0.
- Dòng của mình luôn ghim cuối danh sách nếu mình ngoài top hiển thị.
- Đọc từ view `club_rankings` (đã lọc quyền), phân trang 50.

Nghiệm thu:
- [ ] 600 dòng dữ liệu seed: trang tải < 1 giây trên 4G (đo bằng DevTools throttling).
- [ ] Mình hạng 200 → vẫn thấy dòng của mình ở cuối.

---

## Câu hỏi cho BCN
- Level dựa vào gì: tổng km, độ đều đặn, pace, PR, hay số challenge hoàn thành? Có muốn level **theo pace** (nhóm pace 5, 6, 7) tách riêng với level **theo chăm chỉ** không?
- Level có bao giờ **tụt** không (ví dụ nghỉ 3 tháng)? Plan hiện tại: tính trên 12 tháng gần nhất nên có thể tụt.
