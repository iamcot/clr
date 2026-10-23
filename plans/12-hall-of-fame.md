# 12 – Bảng vàng thành tích (V2)

Mục tiêu: một trang tự hào của CLB: kỷ lục CLB ở từng cự ly, giải thưởng tại các giải, vô địch challenge, cột mốc (1.000 km, marathon đầu tiên). Tự cập nhật từ dữ liệu đã có, BCN duyệt.

Phụ thuộc: 05 (PR, race_results đã xác minh), 07 (kết quả challenge), 06 (tổng km).

Thứ tự: 12.1 → 12.2 → 12.3.

---

## Task 12.1 – Kỷ lục CLB

Làm:
- View `club_records`: theo cự ly (`5K`, `10K`, `HM`, `FM`) × giới tính (× nhóm tuổi nếu BCN muốn, cấu hình trong `src/config/hallOfFame.ts`), lấy top 10 thời gian tốt nhất.
- Nguồn tính: **quyết định tạm** chỉ dùng `race_results` đã BCN xác minh (thời gian chip giải chính thức), không dùng best efforts Strava (dễ sai GPS, dễ tranh cãi). Đổi được trong config.
- Có kỷ lục mới → tạo bài system (10) chúc mừng.

Nghiệm thu:
- [ ] Xác minh một kết quả HM nhanh hơn kỷ lục hiện tại → kỷ lục đổi, có bài chúc mừng.

---

## Task 12.2 – Danh hiệu và cột mốc

Làm:
- Bảng `honors (id, member_id, kind ('podium','challenge_champion','milestone','special'), title, detail, date, race_result_id null, challenge_id null, image_url, created_by, approved bool)`.
- Tự sinh (chờ BCN duyệt):
  - `podium`: `race_results` có `rank_overall` hoặc `rank_age_group` ≤ 3.
  - `challenge_champion`: hạng 1 mỗi hạng mục khi chốt challenge.
  - `milestone`: tổng km tích luỹ trong CLB vượt 1.000 / 2.000 / 5.000 km; hoàn thành FM đầu tiên; 12 tháng liền hoàn thành challenge. Danh sách mốc trong config.
- BCN thêm tay danh hiệu `special` (ví dụ "Thành viên tích cực năm 2026").

Nghiệm thu:
- [ ] Seed một kết quả giải hạng 2 lứa tuổi → có danh hiệu chờ duyệt ở `/admin/honors`.

---

## Task 12.3 – Trang bảng vàng

Làm:
- `/hall-of-fame`: tab **Kỷ lục / Podium / Challenge / Cột mốc**. Lọc theo năm.
- Mỗi danh hiệu hiện trên hồ sơ thành viên (05) dạng huy hiệu.
- Trang có thể xem không cần đăng nhập? **Quyết định tạm: không** (chỉ thành viên), tránh lộ dữ liệu thành viên ra ngoài.

Nghiệm thu:
- [ ] Hồ sơ người có podium hiện huy hiệu, chạm vào mở chi tiết giải.

---

## Câu hỏi cho BCN
- Kỷ lục CLB chia nhóm tuổi không? Nhóm nào (dưới 40, 40–49, 50+)?
- Có cần nhập lại **thành tích lịch sử** trước khi có app không? Nếu có, gửi file Excel để làm script nhập.
