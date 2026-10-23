# 16 – Quỹ CLB và nộp phạt bằng VietQR ⚠️ (V3)

Mục tiêu: thành viên bấm "Nộp" → hiện mã VietQR có sẵn số tiền + nội dung → quét bằng app ngân hàng → vài giây sau khoản phạt tự chuyển "Đã nộp", quỹ tự cộng. BCN/thủ quỹ không phải dò sao kê.

Phụ thuộc: 08 (penalties), 17 dùng chung bảng thu chi.

Thứ tự: 16.1 → 16.2 → 16.3 → 16.4 → 16.5.

---

## Chọn dịch vụ đối soát

| | SePay | Casso |
|---|---|---|
| Cách hoạt động | Đọc biến động số dư tài khoản ngân hàng, bắn webhook khi có tiền vào | Tương tự |
| Ngân hàng | Nhiều ngân hàng lớn (kiểm danh sách lúc làm) | Tương tự |
| Giá | Có gói miễn phí số giao dịch thấp | Có gói miễn phí số giao dịch thấp |

**Quyết định tạm: SePay** (webhook đơn giản, tài liệu rõ). Viết lớp `BankFeed` để đổi sang Casso chỉ cần thêm adapter. Kiểm lại giá và giới hạn gói miễn phí lúc làm, ghi vào `PROGRESS.md`.

Tài khoản nhận nên là **tài khoản riêng của quỹ CLB** (không phải tài khoản cá nhân đang dùng chi tiêu), để mọi tiền vào đều là tiền quỹ.

---

## Task 16.1 – Sổ quỹ

Làm (migration mới):
- `fund_accounts (id, name, kind ('bank','cash'), bank_bin text, account_no text, account_name text, active)` – tài khoản ngân hàng quỹ + "quỹ tiền mặt" do thủ quỹ giữ.
- `fund_transactions (id, account_id, direction ('in','out'), amount bigint check > 0, category_id, occurred_at, description, member_id null, penalty_id null, event_id null, bank_event_id null, receipt_url null, created_by, created_at, voided_at null, void_reason)`.
  - Không xoá, không sửa số tiền: sai thì **huỷ** (`voided_at`) và tạo dòng mới. Mọi thao tác vào `audit_logs`.
- `fund_categories (id, direction, name)`: Thu: Phạt, Đóng quỹ, Tài trợ, Khác. Chi: Event, Giải thưởng, Áo/đồng phục, Vận hành app, Khác.
- Số dư = tổng `in` − tổng `out` (không voided); view `fund_balances`.
- RLS: thành viên đọc tổng hợp (17); chi tiết giao dịch chỉ `treasurer`/`bcn`.

Nghiệm thu:
- [ ] Không thể `update amount` hoặc `delete` dòng giao dịch (kể cả BCN, chặn bằng trigger).

---

## Task 16.2 – Mã VietQR

Làm:
- `src/lib/vietqr/payload.ts` (hàm thuần): sinh chuỗi EMVCo VietQR (Napas 247) từ `bank_bin`, `account_no`, `amount`, `addInfo`, có CRC16-CCITT. Vẽ QR bằng... (cần một thư viện sinh QR, ví dụ `qrcode`: **hỏi trước khi thêm**). Phương án không thêm thư viện: dùng ảnh từ `img.vietqr.io` (Quick Link), nhưng phụ thuộc dịch vụ ngoài.
- Nội dung chuyển khoản: `CLR{member_code} {ref}` với `ref` ngắn 6 ký tự (chữ hoa + số, không dùng O/0/I/1 dễ nhầm), duy nhất cho mỗi **lần nộp** (`payment_intents (id, member_id, ref unique, amount, penalty_ids uuid[], status ('pending','paid','expired','mismatch'), created_at, expires_at, paid_at, bank_event_id)`).
  - Không có dấu, không ký tự đặc biệt (nhiều ngân hàng cắt/đổi).
- Test: payload đúng chuẩn với 2 mẫu đã kiểm bằng app ngân hàng thật (ghi mẫu vào fixture), CRC đúng.

Nghiệm thu:
- [ ] Quét mã bằng 3 app ngân hàng khác nhau: tự điền đúng số tài khoản, tên, số tiền, nội dung.

---

## Task 16.3 – Webhook ngân hàng + đối soát ⚠️

Làm:
- `POST /api/bank/webhook/sepay`: kiểm API key/ chữ ký theo docs SePay; ghi nguyên văn vào `bank_webhook_events (id, provider, provider_txn_id unique, amount, content, account_no, transferred_at, raw jsonb, received_at, match_status, matched_intent_id)`; trả 200 nhanh. Trùng `provider_txn_id` → bỏ qua (webhook gửi lại).
- `src/lib/vietqr/match.ts` (hàm thuần): tìm `ref` trong nội dung (không phân biệt hoa thường, chịu được ngân hàng chèn thêm chữ, bỏ khoảng trắng/dấu gạch) → intent.
  - Khớp ref + **đủ tiền** → intent `paid`, các penalty trong intent `paid` (`paid_method = 'vietqr'`), tạo `fund_transactions` (in, Phạt), thông báo (14).
  - Khớp ref nhưng **thiếu/thừa tiền** → `mismatch`, đưa vào hàng chờ thủ quỹ xử lý tay.
  - Không khớp ref nhưng có `CLR{member_code}` → gợi ý thành viên, chờ xử lý tay.
  - Không khớp gì → vẫn ghi `fund_transactions` (in, Khác) ở trạng thái chờ phân loại.
- Test đủ các ca: nội dung bị ngân hàng thêm tiền tố "MBVCB.123456.", viết thường, thiếu khoảng trắng, chuyển 2 lần cùng ref.

Nghiệm thu:
- [ ] Chuyển thật 2.000đ với khoản phạt thử → trong ≤ 30 giây khoản phạt "Đã nộp", số dư quỹ tăng 2.000đ, có thông báo.
- [ ] Gọi webhook không có/ sai key → 401, không ghi gì.
- [ ] Gửi lại cùng webhook → không cộng tiền hai lần.

---

## Task 16.4 – Màn nộp phạt

Làm (theo màn "Thưởng-phạt & quỹ" của mockup):
- Tab Quỹ: tổng nợ, chọn các khoản muốn nộp (mặc định tất cả) → **Nộp bằng VietQR** → mã QR lớn, số tiền, nội dung (nút sao chép), nút "Lưu ảnh QR" (để mở app ngân hàng chọn ảnh), đếm ngược hết hạn (24 giờ).
- Màn chờ: tự chuyển "Đã nhận tiền 🎉" khi webhook về (Supabase Realtime trên `payment_intents`).
- Vẫn giữ lựa chọn "Tôi đã nộp tiền mặt cho thủ quỹ" → tạo yêu cầu cho thủ quỹ xác nhận.

Nghiệm thu:
- [ ] Trên iPhone: lưu ảnh QR vào Ảnh, mở app ngân hàng quét từ ảnh thành công.
- [ ] Đang ở màn chờ thì tiền về → màn tự đổi không cần tải lại.

---

## Task 16.5 – Admin quỹ

Làm:
- `/admin/fund`: số dư từng tài khoản, giao dịch gần đây, **hàng chờ xử lý** (mismatch, chưa phân loại), ghép tay giao dịch với khoản phạt/thành viên.
- Thêm thu/chi tay (chi tiền event, mua giải thưởng) kèm ảnh hoá đơn (R2, 11.4).
- Đối chiếu: nhập số dư thực tế theo sao kê cuối tháng → app báo chênh lệch.

Nghiệm thu:
- [ ] Ghép tay một giao dịch "mismatch" với khoản phạt → khoản phạt "Đã nộp", có log.

---

## Câu hỏi cho BCN
- CLB đã có tài khoản ngân hàng **riêng cho quỹ** chưa? Ngân hàng nào (để kiểm SePay/Casso hỗ trợ)?
- Ai là thủ quỹ? Có cần 2 người duyệt cho khoản chi lớn không?
