# 17 – Báo cáo tài chính, công khai quỹ (V3)

Mục tiêu: thành viên xem quỹ còn bao nhiêu, thu từ đâu, chi vào việc gì theo tháng. BCN xuất báo cáo để chốt sổ.

Phụ thuộc: 16.1 (sổ quỹ).

Thứ tự: 17.1 → 17.2 → 17.3.

---

## Task 17.1 – Tổng hợp

Làm:
- View/hàm `fund_report(from, to)`: số dư đầu kỳ, tổng thu theo nhóm, tổng chi theo nhóm, số dư cuối kỳ; số khoản phạt phát sinh / đã thu / còn nợ / đã miễn trong kỳ.
- Hàm thuần `src/lib/finance/report.ts` gom dữ liệu + test (đầu kỳ + thu − chi = cuối kỳ, bỏ dòng voided).

Nghiệm thu:
- [ ] Test cân sổ pass với dữ liệu seed có giao dịch huỷ.

---

## Task 17.2 – Trang công khai cho thành viên

Làm:
- Tab Quỹ, phần "Quỹ CLB": số dư hiện tại, biểu đồ cột thu/chi 12 tháng (SVG tự vẽ), bảng tháng này theo nhóm.
- Danh sách khoản chi (ngày, nội dung, số tiền, ảnh hoá đơn nếu BCN chọn công khai). Khoản thu từ phạt chỉ hiện tổng, không hiện tên từng người (trừ khi BCN chọn công khai ở 8.1).
- **Quyết định tạm:** mọi thành viên active xem được; người ngoài không.

Nghiệm thu:
- [ ] Số dư trên trang khớp số dư ở `/admin/fund`.

---

## Task 17.3 – Báo cáo cho BCN

Làm:
- `/admin/fund/reports`: chọn tháng/quý/năm, xem báo cáo, xuất **CSV** và bản in (trang `print` CSS gọn, in ra PDF bằng trình duyệt, không thêm thư viện PDF).
- Chốt sổ tháng: khoá giao dịch của tháng đã chốt (không thêm/huỷ được nữa trừ khi thủ quỹ mở khoá có lý do, ghi log).
- Tự đăng bài tóm tắt quỹ tháng lên bảng tin (10) khi chốt sổ (bật/tắt trong `settings`).

Nghiệm thu:
- [ ] Chốt sổ tháng 10 → thêm giao dịch ngày 15/10 bị từ chối.
- [ ] Bản in vừa khổ A4, có tên CLB, kỳ báo cáo, chữ ký thủ quỹ/chủ nhiệm để trống.

---

## Câu hỏi cho BCN
- Báo cáo quỹ hiện làm theo mẫu nào (Excel)? Gửi mẫu để làm cho giống.
- Kỳ chốt sổ: hàng tháng hay hàng quý?
