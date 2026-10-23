# 14 – Thông báo đẩy (V2)

Mục tiêu: điện thoại rung khi có tin quan trọng, challenge sắp hết hạn mà còn thiếu km, có khoản phạt mới, event sắp diễn ra. Không spam.

Phụ thuộc: 09 (PWA đã cài; iPhone cần iOS 16.4+ và **phải cài ra màn hình chính** mới nhận được push).

Thứ tự: 14.1 → 14.2 → 14.3.

---

## Task 14.1 – Đăng ký nhận thông báo

Làm:
- Sinh cặp khoá VAPID (script một lần), lưu env `VAPID_PUBLIC_KEY` (lộ ra client được), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Bảng `push_subscriptions (id, member_id, endpoint text unique, p256dh, auth, user_agent, created_at, last_success_at, failed_count)`.
- Thẻ "Bật thông báo" ở trang chủ: **chỉ xin quyền khi người dùng bấm** (không hỏi ngay khi mở app). iPhone chưa cài PWA → hiện hướng dẫn cài trước (9.3).
- Service worker (9.2) thêm `push` (hiện notification: tiêu đề, nội dung, icon, `data.url`) và `notificationclick` (mở/focus đúng trang).

Nghiệm thu:
- [ ] Android Chrome và iPhone (đã cài PWA) bật được thông báo, nhận được thông báo thử từ `/admin`.

---

## Task 14.2 – Gửi thông báo

Làm:
- `src/lib/push/send.ts` (server only) dùng `web-push`; gửi theo lô, endpoint trả 404/410 → xoá subscription; lỗi khác tăng `failed_count`.
- Bảng `notifications (id, member_id, kind, title, body, url, created_at, read_at)` – hộp thư trong app (biểu tượng chuông), push chỉ là kênh phụ.
- `notification_prefs (member_id, kind, push bool, pk)` – thành viên tắt từng loại.
- Loại thông báo (trong `src/config/notifications.ts`):

| kind | Khi nào | Mặc định push |
|---|---|---|
| `post_important` | BCN đăng bài có tick "Gửi thông báo" | bật |
| `challenge_reminder` | Còn 3 ngày, tiến độ < 80% (mỗi challenge tối đa 2 lần) | bật |
| `challenge_result` | Challenge chốt kết quả | bật |
| `penalty_new` | Có khoản phạt mới | bật |
| `penalty_paid` | Khoản phạt được xác nhận đã nộp | bật |
| `event_reminder` | Event mình đăng ký còn 12 giờ | bật |
| `level_up` | Lên level | bật |
| `comment_reply` | Có người trả lời bình luận của mình | tắt |
| `new_follower` | Có người theo dõi mình | tắt |

- Giờ yên lặng 22:00–06:00 (giờ VN): thông báo không khẩn dồn sang 06:00. Riêng `post_important` BCN chọn được "gửi ngay".
- Các job nhắc (challenge, event) chạy bằng `pg_cron` gọi route `/api/cron/notify`.

Nghiệm thu:
- [ ] Tạo khoản phạt cho mình → nhận push trong ≤ 1 phút, bấm vào mở đúng trang Quỹ.
- [ ] Tắt `penalty_new` trong cài đặt → vẫn thấy trong chuông, không có push.
- [ ] Tạo thông báo lúc 23:00 → push đến lúc 06:00.

---

## Task 14.3 – Admin gửi thông báo

Làm:
- `/admin/notifications`: soạn và gửi thông báo cho tất cả / chính thức / tự do / người tham gia một challenge hoặc event. Xem trước, đếm số người sẽ nhận.
- Thống kê: số máy đã đăng ký push, tỉ lệ gửi thành công.

Nghiệm thu:
- [ ] Gửi cho "người tham gia event X" → chỉ đúng nhóm đó nhận.
