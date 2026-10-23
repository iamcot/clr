# 15 – Liên kết CLB và liên hệ BCN (V2)

Mục tiêu: mọi đường dẫn của CLB (nhóm Zalo, fanpage, Facebook group, Strava club, quy chế) ở một chỗ, luôn đúng. Thành viên cần hỗ trợ thì gửi yêu cầu cho BCN và theo dõi được trạng thái.

Task 15.1 làm sớm được (rất nhỏ), có thể chen vào MVP.

---

## Task 15.1 – Trang liên kết

Làm:
- Lưu trong `settings` key `club_links`: danh sách `{ kind ('zalo','facebook_page','facebook_group','strava_club','website','other'), title, url, note, sort }`. BCN sửa ở `/admin/settings/links`.
- `/club`: tên CLB, logo, giới thiệu ngắn, các nút lớn có biểu tượng mở link (Zalo mở bằng `https://zalo.me/g/...`, app Zalo tự bắt).
- Liên kết hiện thêm ở `/pending` (người chờ duyệt vào nhóm Zalo trước) và cuối trang "Tôi".

Nghiệm thu:
- [ ] Trên điện thoại có cài Zalo: bấm link nhóm Zalo mở thẳng app Zalo.
- [ ] BCN đổi link → app hiện link mới ngay (không cần deploy).

---

## Task 15.2 – Quy chế CLB

Làm:
- Bảng `documents (id, slug, title, body_md, version int, published_at, updated_by)` + `document_versions` lưu bản cũ.
- `/club/rules`: quy chế hiện hành, mục lục tự sinh từ tiêu đề, ngày cập nhật, xem bản cũ.
- Quy chế đổi bản mới → tuỳ chọn bắt thành viên xác nhận đã đọc (dùng cơ chế `require_ack` của 10 bằng bài thông báo tự sinh).
- Mức phạt trong quy chế nên **đọc từ `penalty_types`** (chèn bảng tự động bằng thẻ `{{penalty_table}}`) để không lệch với app.

Nghiệm thu:
- [ ] Sửa mức phạt trong `/admin/penalties` → bảng phạt trong quy chế đổi theo.

---

## Task 15.3 – Liên hệ BCN

Làm:
- `/club/bcn`: danh sách BCN (ảnh, tên, phụ trách mảng gì, nút nhắn Zalo cá nhân nếu người đó đồng ý công khai).
- Gửi yêu cầu hỗ trợ: bảng `support_tickets (id, member_id, category ('account','strava_sync','challenge','penalty','fund','other'), subject, status ('open','in_progress','resolved'), assigned_to null, created_at, resolved_at)` + `support_messages (id, ticket_id, author_id, body, attachment_url, created_at)`.
  - Mẫu nhanh: "Hoạt động của tôi không được tính", "Tôi muốn xin miễn phạt", "Tôi đã nộp phạt nhưng chưa cập nhật". Mẫu "không được tính" tự đính kèm hoạt động được chọn.
- BCN: `/admin/support` hộp thư, lọc theo loại/trạng thái, nhận việc, trả lời; thành viên nhận thông báo (14) khi có trả lời.
- RLS: thành viên chỉ thấy yêu cầu của mình; BCN thấy tất cả.

Nghiệm thu:
- [ ] Thành viên gửi "Tôi đã nộp phạt" kèm ảnh chụp chuyển khoản → BCN thấy, trả lời, đóng; thành viên thấy trạng thái "Đã xử lý".

---

## Câu hỏi cho BCN
- Gửi danh sách link hiện tại (Zalo, fanpage, group, Strava club) và file quy chế mới nhất.
- BCN có bao nhiêu người, ai phụ trách mảng nào?
