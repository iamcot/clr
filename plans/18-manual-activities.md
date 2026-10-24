# 18 – Hoạt động nhập tay (khi Strava chưa sync tới)

Mục tiêu: thành viên có buổi chạy chưa về từ Strava (đang kéo lịch sử, lỗi sync, quên bật chia sẻ) vẫn nhập tay được, gửi ảnh chụp Strava làm bằng chứng, BCN duyệt rồi mới tính. Làm sau Task 7-9, cần CoT chốt các câu hỏi cuối file.

---

## Task 18.1 – Schema

- Bảng `manual_activities (id, member_id, start_date timestamptz, distance_m int, moving_time_s int, elevation_gain_m int default 0, sport_type text default 'Run', note text, proof_path text, status text ('pending','approved','rejected'), reviewed_by, reviewed_at, reject_reason, created_at)`.
- Ảnh bằng chứng lưu ở storage (bucket private), chỉ chủ và BCN đọc.
- RLS: thành viên thêm và đọc của mình, chỉ khi `status = 'pending'` mới sửa/xoá; BCN đọc tất cả và đổi `status`.
- Khi `approved`, sinh một dòng trong `activities` với `source = 'manual'` (thêm cột `source`, mặc định `'strava'`) và `counts_for_club = true`, id âm hoặc khoá riêng để không đụng id Strava. Từ chối hoặc huỷ duyệt thì xoá dòng đó.
- Dòng `source = 'manual'` không bị Strava webhook ghi đè. Nếu sau đó Strava sync đúng buổi đó (cùng ngày, km lệch < 2%) thì đánh dấu trùng và bỏ bản nhập tay.

## Task 18.2 – Màn thành viên

- `/me/activities/new`: ngày giờ, km, thời gian, độ cao (không bắt buộc), ảnh Strava (bắt buộc). Có giới hạn số lần nhập tay mỗi tháng (đặt trong `settings`).
- Danh sách buổi đã gửi và trạng thái chờ duyệt, được duyệt, bị từ chối kèm lý do. Hoạt động nhập tay có nhãn riêng.

## Task 18.3 – Màn BCN

- `/admin/manual-activities`: hàng chờ duyệt, xem ảnh, duyệt hoặc từ chối (bắt buộc lý do), ghi `audit_logs`.
- Sau khi duyệt chạy lại thống kê, level và challenge của thành viên (dùng hook `onActivitiesChanged`).

## Nghiệm thu
- [ ] Nhập tay, BCN duyệt, km hiện ở trang Tôi và tính vào challenge đúng luật (đoạn lọc pace, km tối thiểu vẫn áp dụng).
- [ ] BCN từ chối thì không tính.
- [ ] Buổi đã duyệt nhưng sau đó Strava sync trùng thì không bị đếm hai lần.
- [ ] Thành viên không xem được ảnh của người khác.

## Câu hỏi cho CoT
- Mỗi tháng cho nhập tối đa bao nhiêu buổi?
- Có cho nhập tay buổi cũ quá bao nhiêu ngày? (đề xuất 30 ngày)
- Buổi nhập tay có được tính cho bảng vàng và PR không, hay chỉ cho thống kê và challenge? (đề xuất: chỉ thống kê và challenge, PR vẫn qua mục Kết quả giải)
