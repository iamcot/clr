# 10 – Bảng tin CLB (V2)

Mục tiêu: BCN đăng thông báo quan trọng, thành viên thả tim, bình luận, BCN biết ai đã đọc. Thay cho việc tin quan trọng bị trôi trong nhóm Zalo.

Thứ tự: 10.1 → 10.2 → 10.3 → 10.4.

---

## Task 10.1 – Schema

Làm (migration mới):
- `posts (id, author_id, kind ('announcement','result','event','system'), title, body_md text, cover_url, pinned bool, pinned_until timestamptz null, require_ack bool default false, published_at, created_at, updated_at, deleted_at)`.
  - `system`: bài tự sinh (kết quả challenge 7.5, thành viên lên level 6.2, event mới 11).
- `post_reactions (post_id, member_id, emoji text check in ('like','fire','clap','heart'), pk(post_id, member_id))`.
- `post_comments (id, post_id, member_id, body text, parent_id null, created_at, deleted_at)` – trả lời một cấp.
- `post_reads (post_id, member_id, read_at, acked_at null)`.
- RLS: thành viên active đọc bài đã publish; bình luận/thả tim của chính mình; xoá bình luận của mình; BCN đăng/sửa/xoá bài, ẩn bình luận bất kỳ.

---

## Task 10.2 – Trang chủ = bảng tin

Làm (theo màn "Trang chủ/bảng tin" của mockup):
- Đầu trang: khối tóm tắt cá nhân (km tháng, tiến độ challenge chính, số tiền còn nợ nếu có).
- Bài ghim ở trên (tối đa 3), sau đó các bài mới nhất, cuộn vô hạn (20 bài/lần).
- Thẻ bài: tiêu đề, đoạn đầu, ảnh bìa, số tim/bình luận. Bài `require_ack` có nút **"Đã đọc và đồng ý"**.
- `/posts/[id]`: nội dung markdown (render an toàn: chỉ cho phép thẻ cơ bản, không HTML thô), thả cảm xúc, bình luận realtime (Supabase Realtime).
- Badge số bài chưa đọc trên tab Trang chủ.

Nghiệm thu:
- [ ] BCN đăng bài → thành viên mở app thấy bài mới ở trên cùng (sau bài ghim), badge tăng.
- [ ] Hai người cùng mở một bài: bình luận của người này hiện ngay bên kia.
- [ ] Nội dung có `<script>` → hiện dạng chữ, không chạy.

---

## Task 10.3 – Admin bài viết

Làm:
- `/admin/posts`: soạn bài (markdown + xem trước, chèn ảnh upload R2 dùng helper 11.4), hẹn giờ đăng, ghim (có hạn), bật "cần xác nhận đã đọc".
- Bài `require_ack`: thống kê đã đọc / đã xác nhận / chưa đọc, danh sách người chưa xác nhận, xuất CSV (để nhắc riêng).
- Gửi thông báo đẩy khi đăng (nếu 14 đã có; có ô tick "Gửi thông báo").

Nghiệm thu:
- [ ] Hẹn giờ 20:00 → đúng 20:00 bài mới hiện (sai số ≤ 1 phút).
- [ ] Danh sách "chưa xác nhận" đúng sau khi 2 người bấm xác nhận.

---

## Task 10.4 – Bài tự sinh

Làm:
- Khi chốt challenge (7.5): bài `result` có top mỗi hạng mục, số người hoàn thành, link bảng xếp hạng.
- Thành viên lên level (6.2): gộp thành một bài/tuần "Chúc mừng các thành viên lên level tuần này" (không spam mỗi người một bài).
- Bài tự sinh BCN sửa được trước khi publish (mặc định tự publish, bật/tắt trong `settings`).

Nghiệm thu:
- [ ] Chốt challenge thử → có bài kết quả với số đúng.

---

## Câu hỏi cho BCN
- Thành viên thường có được **tự đăng bài** (khoe thành tích, rủ chạy) không, hay chỉ BCN đăng? Plan hiện tại: chỉ BCN đăng, thành viên bình luận.
