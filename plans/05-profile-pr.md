# 05 – Hồ sơ, PR, thành tích giải

Mục tiêu: trang "Tôi" cho thấy ngay mình là ai trong CLB: PR các cự ly, các giải đã chạy, level. PR tự lấy từ Strava, thành tích giải nhập một lần.

Thứ tự: 5.1 → 5.2 → 5.3 → 5.4.

---

## Task 5.1 – PR tự động từ best efforts

Làm:
- `src/config/prDistances.ts`: danh sách cự ly hiển thị (`1K`, `5K`, `10K`, `Half-Marathon` (21,1K), `Marathon` (42,2K)); tên khớp `name` của Strava best efforts.
- View `member_prs`: với mỗi thành viên + cự ly, lấy `elapsed_time_s` nhỏ nhất từ `activity_best_efforts` của hoạt động `counts_for_club = true`, kèm `activity_id`, ngày.
- Thành viên ghi đè được: bảng `pr_overrides (member_id, distance_name, time_s, source text, race_result_id null, note)` để nhập PR từ giải chính thức (thời gian chip) thay cho Strava. Ưu tiên override nếu có.
- `src/lib/stats/format.ts`: `formatDuration(s)` → `h:mm:ss` / `mm:ss`, `formatPace(distanceM, timeS)` → `m:ss/km`, `formatKm(m)` → `12,3 km` (dấu phẩy thập phân kiểu Việt). Có test.

Nghiệm thu:
- [ ] PR 5K trong app khớp với PR hiện trên Strava (với dữ liệu đã kéo về).
- [ ] Nhập override 10K từ giải → hiện thời gian chip, nhãn "Giải chính thức".
- [ ] Test format: `formatPace(5000, 1500)` = `5:00/km`, `formatDuration(3725)` = `1:02:05`.

---

## Task 5.2 – Thành tích các giải đã tham gia

Làm:
- Bảng `races (id, name, date, city, organizer, url, created_by)` dùng chung (nhiều người cùng chạy một giải chỉ tạo một lần; gợi ý khi gõ tên).
- Bảng `race_results (id, member_id, race_id, distance_label text, distance_m int, chip_time_s int, gun_time_s int null, rank_overall int null, rank_age_group int null, bib text null, certificate_url text null, activity_id bigint null, verified_by uuid null, verified_at, created_at)`.
- `/me/races`: danh sách giải đã chạy (mới nhất trước), thêm/sửa/xoá. Ảnh giấy chứng nhận (tuỳ chọn) upload R2 (dùng helper upload ở `11-events-album.md` task 11.4; nếu task đó chưa làm thì tạm chỉ nhận link).
- Gợi ý gắn hoạt động Strava cùng ngày có cự ly gần đúng.
- Có kết quả giải ở cự ly PR → hỏi "Dùng làm PR?" → tạo `pr_overrides`.
- BCN xác minh kết quả ở `/admin/races` (để dùng cho bảng vàng V2).

Nghiệm thu:
- [ ] Thêm "VnExpress Marathon Huế 2026 – 21K – 1:45:12" → hiện trong hồ sơ, có gắn hoạt động Strava hôm đó.
- [ ] Người thứ hai gõ "VnEx" → gợi ý đúng giải đã có.

---

## Task 5.3 – Trang "Tôi"

Làm (theo màn "Hồ sơ & thống kê" của mockup):
- Đầu trang: ảnh, tên, loại thành viên, mã, level (06), số người theo dõi.
- Khối số liệu nhanh: km tháng này, km năm nay, số buổi tháng, pace trung bình tháng (lấy từ 06; task này hiển thị số giả nếu 06 chưa xong và ghi chú lại).
- Khối PR (5.1), khối Giải đã chạy (5.2, 3 giải gần nhất + "Xem tất cả").
- Khối Challenge: số challenge đã tham gia / hoàn thành, số tiền phạt chưa nộp (07, 08).
- Danh sách hoạt động gần đây (của mình, có bản đồ nhỏ từ `summary_polyline` vẽ bằng SVG, không dùng thư viện bản đồ). Có attribution "Powered by Strava" và link "View on Strava" mỗi hoạt động theo brand guideline.

Nghiệm thu:
- [ ] Trên điện thoại 360px không vỡ bố cục, không cuộn ngang.
- [ ] Bấm "View on Strava" mở đúng hoạt động.

---

## Task 5.4 – Hồ sơ công khai

Làm:
- `/members/[id]`: cùng bố cục nhưng chỉ phần được phép (task 3.0): tên, ảnh, level, PR, giải đã chạy, số liệu tổng nếu người đó cho chia sẻ. Không có bản đồ, không có hoạt động riêng tư.

Nghiệm thu:
- [ ] Người tắt chia sẻ: trang công khai không có số km/pace, chỉ còn giải đã chạy và PR từ giải (dữ liệu nhập tay, không phải dữ liệu Strava).

---

## Câu hỏi cho BCN
- Ngoài 5 cự ly trên có cần cự ly khác (ví dụ 3K, 15K, ultra 50K/100K)?
- PR dùng **thời gian Strava** hay **thời gian chip giải chính thức** làm chuẩn cho bảng vàng?
