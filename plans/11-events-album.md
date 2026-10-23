# 11 – Event và album ảnh (V2)

Mục tiêu: BCN tạo event (chạy nhóm, giải, offline, từ thiện), thành viên đăng ký, điểm danh, thống kê người tham gia và km, lưu ảnh event lâu dài trên R2.

Thứ tự: 11.1 → 11.2 → 11.3 → 11.4 → 11.5 → 11.6.

---

## Task 11.1 – Schema

Làm (migration mới):
- `events (id, title, kind ('group_run','race','social','charity','other'), description_md, cover_url, location_name, location_lat, location_lng, starts_at, ends_at, registration_closes_at, capacity int null, fee bigint null, route_distance_m int null, race_id null fk races, status ('draft','published','cancelled','done'), absent_penalty bool default false, created_by, created_at, updated_at)`.
- `event_attendees (event_id, member_id, status ('going','maybe','not_going','waitlist'), checked_in_at null, checked_in_by null, activity_id bigint null, note, pk(event_id, member_id))`.
- `event_photos (id, event_id, uploaded_by, object_key, thumb_key, width, height, bytes, taken_at, caption, hidden bool, created_at)`.
- RLS: thành viên đọc event publish; tự đăng ký của mình trước hạn; BCN toàn quyền; ảnh: thành viên upload vào event mình tham gia (hoặc mọi event – quyết định tạm: mọi thành viên), xoá ảnh của mình; BCN ẩn/xoá bất kỳ.

---

## Task 11.2 – Màn event cho thành viên

Làm (theo màn "Event & album" của mockup):
- `/events`: Sắp tới (thẻ: ngày, giờ, nơi, số người đi, nút Tham gia), Đã qua (ảnh bìa + số ảnh).
- `/events/[id]`: thông tin, bản đồ tĩnh (link mở Google Maps), danh sách người tham gia (ảnh nhỏ), nút **Đi / Có thể / Không đi**, thêm vào lịch (file `.ics`).
- Hết chỗ → vào `waitlist`, có người huỷ thì người đầu waitlist tự lên `going` (thông báo).

Nghiệm thu:
- [ ] Event 2 chỗ, 3 người đăng ký → người thứ 3 waitlist; một người huỷ → người thứ 3 thành Đi.
- [ ] Bấm "Thêm vào lịch" trên iPhone/Android mở được lịch.

---

## Task 11.3 – Điểm danh + tự gắn hoạt động

Làm:
- BCN điểm danh tại chỗ: `/admin/events/[id]/checkin` danh sách người đăng ký, chạm để tick (to, dễ bấm ngoài trời), tìm tên, thêm người không đăng ký.
- Tự điểm danh: mã QR event hiển thị trên máy BCN; thành viên quét bằng camera điện thoại (mở link `/events/[id]/checkin?code=...`, code đổi mỗi 30 giây chống gửi link cho người vắng).
- Tự gắn hoạt động Strava: hoạt động của người tham gia bắt đầu trong khung `starts_at − 1h` → `ends_at + 1h` và gần địa điểm (bán kính trong config, ví dụ 3 km từ `start_latlng`) → `activity_id`. Có hoạt động khớp mà chưa điểm danh → gợi ý BCN tick.
- Sau event: người `going` mà không điểm danh và không có hoạt động khớp, event có `absent_penalty` → BCN xem danh sách, bấm sinh phạt `event_absent` (dùng 8.1).

Nghiệm thu:
- [ ] Quét QR bằng camera iPhone → điểm danh thành công; dùng link cũ sau 1 phút → báo mã hết hạn.
- [ ] Chạy thật ở địa điểm event → hoạt động tự gắn vào event.

---

## Task 11.4 – Upload ảnh lên R2 (helper dùng chung) ⚠️

Làm:
- `src/lib/storage/r2.ts` (server only): `createUploadUrl({ key, contentType, maxBytes })` trả presigned PUT URL (hạn 5 phút), `publicUrl(key)`, `deleteObject(key)`.
- Bucket R2 công khai qua custom domain (ví dụ `img.clr.vn`) cho ảnh event; ảnh giấy chứng nhận (5.2) để prefix riêng, vẫn công khai nhưng key ngẫu nhiên khó đoán (quyết định tạm, đủ cho mức nhạy cảm thấp).
- Client: chọn nhiều ảnh, **nén trước khi upload** bằng canvas (cạnh dài 2048px, JPEG 0,82) + sinh thumbnail 480px, đọc EXIF ngày chụp, bỏ EXIF GPS. Upload song song tối đa 3, thanh tiến độ từng ảnh, thử lại khi lỗi mạng.
- Route Handler `POST /api/uploads` kiểm quyền, kiểu file (jpeg/png/heic/webp), kích thước, sinh key `events/{eventId}/{uuid}.jpg` + `..._thumb.jpg`, trả 2 URL; client upload xong gọi `POST /api/uploads/complete` để ghi `event_photos`.
- HEIC từ iPhone: Safari tự chuyển sang JPEG khi chọn qua `<input type=file accept=image/*>`; nếu vẫn nhận HEIC thì báo lỗi rõ ràng (không thêm thư viện giải HEIC).

Nghiệm thu:
- [ ] Upload 30 ảnh từ iPhone qua 4G: xong, mỗi ảnh ≤ ~600 KB, có thumbnail.
- [ ] Gọi `/api/uploads` khi chưa đăng nhập → 401. Gửi file `.exe` đổi đuôi → bị từ chối.
- [ ] Ảnh tải về không còn toạ độ GPS.

Pitfall:
- R2 cần cấu hình CORS cho domain app (PUT từ trình duyệt). Ghi cấu hình vào `README.md`.

---

## Task 11.5 – Album

Làm:
- `/events/[id]/photos`: lưới thumbnail (lazy load), chạm mở xem toàn màn, vuốt trái/phải, tải ảnh gốc, chia sẻ (Web Share API).
- `/photos`: album tổng theo event, mới nhất trước.
- Lọc "Ảnh có tôi": **không làm nhận diện khuôn mặt**; thay bằng người upload/được gắn tên (`event_photo_tags (photo_id, member_id)`), thành viên tự gắn mình.
- BCN ẩn ảnh không phù hợp, chọn ảnh bìa event.

Nghiệm thu:
- [ ] Album 300 ảnh cuộn mượt trên điện thoại tầm trung, chỉ tải thumbnail đang thấy.

---

## Task 11.6 – Thống kê event

Làm:
- `/admin/events/stats`: theo tháng/năm: số event, tổng lượt đăng ký, tỉ lệ đến thực tế (điểm danh / đăng ký), tổng km tại event, top thành viên đi event nhiều nhất.
- Trang event đã qua: số người đến, tổng km, pace trung bình nhóm.

Nghiệm thu:
- [ ] Số liệu khớp đếm tay với 2 event seed.

---

## Câu hỏi cho BCN
- Ảnh event hiện đang để ở đâu (Google Photos, Facebook)? Có cần **chuyển ảnh cũ** vào app không?
- Dự kiến mỗi tháng bao nhiêu ảnh? (R2 miễn phí 10 GB lưu trữ, không tính phí băng thông tải xuống; quá 10 GB khoảng 0,015 USD/GB/tháng.)
