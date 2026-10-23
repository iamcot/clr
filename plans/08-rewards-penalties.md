# 08 – Thưởng phạt (cơ bản)

Mục tiêu: mỗi khoản phạt/thưởng có nguồn rõ ràng (challenge nào, vi phạm gì), thành viên biết mình nợ bao nhiêu, BCN đánh dấu đã nộp. Bản MVP **chưa** có VietQR tự đối soát (ở `16-fund-vietqr.md`), nhưng schema làm sẵn để V3 cắm vào.

Thứ tự: 8.1 → 8.2 → 8.3 → 8.4.

---

## Task 8.1 – Schema

Làm (migration mới):
- `penalty_types (id, code, name, default_amount bigint, active)`: ví dụ `challenge_fail` (không đạt challenge), `challenge_low` (đạt dưới 50%), `event_absent` (đăng ký event mà vắng), `rule_violation` (vi phạm quy chế), `other`. Seed từ `src/config/penalties.ts`.
- `penalties (id, member_id, type_id, amount bigint, reason text, source_type text null ('challenge','event','manual'), source_id uuid null, status text ('unpaid','paid','waived'), created_by, created_at, paid_at, paid_method text null ('cash','transfer','vietqr'), confirmed_by, waived_reason text, payment_ref text null)`.
  - unique `(member_id, source_type, source_id, type_id)` khi `source_id` không null, để chốt challenge nhiều lần không nhân đôi.
- `rewards (id, member_id, title, amount bigint null, item text null, source_type, source_id, status ('pending','given'), given_at, created_by)`: thưởng có thể là tiền hoặc hiện vật (huy chương, áo).
- RLS: thành viên đọc của mình; danh sách công khai (ai bị phạt, bao nhiêu) **theo quyết định tạm**: mọi thành viên đọc được tổng theo người (minh bạch quỹ), không đọc lý do chi tiết của người khác. BCN thêm/sửa; chỉ `treasurer` (hoặc `bcn` nếu chưa có thủ quỹ) đổi `status` sang `paid`.

Nghiệm thu:
- [ ] Member không tự đánh dấu khoản phạt của mình là đã nộp.

---

## Task 8.2 – Sinh tự động từ challenge

Làm:
- `src/lib/challenges/settle.ts` (hàm thuần): từ entries + `penalty_rule`/`reward_rule` → danh sách phạt/thưởng cần tạo. Ví dụ luật:
  ```json
  { "penalties": [
      { "when": "not_completed", "progress_below": 0.5, "type": "challenge_low", "amount": 200000 },
      { "when": "not_completed", "type": "challenge_fail", "amount": 100000 } ],
    "rewards": [ { "when": "rank_lte", "rank": 3, "per_category": true, "title": "Top 3" } ],
    "exempt_member_types": ["free"] }
  ```
  Luật trên xuống dưới, **mỗi người chỉ khớp luật phạt đầu tiên**.
- Gọi khi BCN chốt challenge (7.5). BCN thấy bản xem trước trước khi xác nhận.
- Có "miễn phạt" theo người (bệnh, chấn thương: BCN chọn người + lý do trước khi chốt → không sinh phạt).

Nghiệm thu:
- [ ] Test: 40% tiến độ → `challenge_low` 200.000đ, không bị thêm `challenge_fail`. 80% → `challenge_fail` 100.000đ. Thành viên tự do → không phạt.
- [ ] Người được miễn trước khi chốt → không có khoản phạt.

---

## Task 8.3 – Admin thưởng phạt

Làm:
- `/admin/penalties`: bảng tất cả khoản, lọc theo trạng thái / loại / tháng / người. Thêm phạt tay (chọn nhiều người một lúc, ví dụ vắng event).
- Chọn nhiều dòng → **Đánh dấu đã nộp** (chọn tiền mặt / chuyển khoản, ghi mã giao dịch nếu có) hoặc **Miễn** (bắt buộc lý do). Mọi thao tác vào `audit_logs`.
- Tổng: đã thu, còn nợ, đã miễn theo tháng.
- `/admin/rewards`: danh sách thưởng, đánh dấu đã trao.
- Xuất CSV.

Nghiệm thu:
- [ ] Đánh dấu 10 khoản đã nộp một lần; tổng "còn nợ" giảm đúng.
- [ ] Sửa số tiền một khoản đã nộp → không cho (phải huỷ trạng thái nộp trước, có log).

---

## Task 8.4 – Màn cho thành viên

Làm (theo màn "Thưởng-phạt & quỹ" của mockup, phần thưởng phạt):
- Tab **Quỹ** (hoặc `/me/penalties` nếu tab Quỹ chưa bật): số tiền còn nợ to, rõ; danh sách khoản (lý do, nguồn, ngày, trạng thái).
- Hướng dẫn nộp tạm thời: số tài khoản quỹ + nội dung chuyển khoản gợi ý `CLR0123 PHAT T11` (lấy từ `settings`), nút sao chép. V3 thay bằng mã VietQR.
- Danh sách thưởng của mình.
- Bảng minh bạch: tổng phạt theo người trong tháng (theo quyền ở 8.1).

Nghiệm thu:
- [ ] Bấm sao chép số tài khoản và nội dung chuyển khoản trên iPhone/Android đều chạy.

---

## Câu hỏi cho BCN
- Mức phạt hiện tại cho từng lỗi là bao nhiêu? Có phạt lũy tiến (tháng thứ hai liên tiếp không đạt phạt gấp đôi) không?
- Danh sách ai nợ bao nhiêu có **công khai** cho cả CLB không, hay chỉ BCN thấy?
- Thưởng thường là gì (tiền từ quỹ, hiện vật)?
