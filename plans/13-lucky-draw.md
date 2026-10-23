# 13 – Quay số challenge online (V2)

Mục tiêu: BCN quay số trúng thưởng (ví dụ trong số người hoàn thành challenge tháng) ngay trên app, cả CLB xem trực tiếp cùng lúc, kết quả minh bạch, không ai nghi "chọn tay".

Phụ thuộc: 07 (danh sách hoàn thành), 08 (ghi thưởng).

Thứ tự: 13.1 → 13.2 → 13.3.

---

## Task 13.1 – Schema + thuật toán

Làm (migration mới):
- `draws (id, title, source_type ('challenge_completed','event_checked_in','manual'), source_id null, status ('draft','live','done','cancelled'), seed_commit text, seed_reveal text null, created_by, started_at, finished_at)`.
- `draw_prizes (id, draw_id, name, quantity, sort)` – ví dụ "Giải nhất: giày", 1; "Giải khuyến khích: tất", 5.
- `draw_participants (draw_id, member_id, weight int default 1, pk)` – danh sách **chốt** trước khi quay (snapshot, không đổi trong lúc quay).
- `draw_results (draw_id, prize_id, member_id, order int, drawn_at)`.
- `src/lib/draw/pick.ts` (hàm thuần): `pickWinners(participants, prizes, seed)` dùng PRNG có seed (ví dụ `mulberry32` từ hash SHA-256 của seed), sắp participants theo `member_id` trước để kết quả tái lập được. Mỗi người trúng tối đa một giải (cấu hình).
- Minh bạch kiểu **commit–reveal**: lúc chốt danh sách, server tạo seed ngẫu nhiên, công bố `seed_commit = sha256(seed)`; quay xong công bố `seed_reveal = seed`. Ai cũng tự kiểm được bằng trang `/draws/[id]/verify` (chạy lại `pickWinners` trên trình duyệt).

Nghiệm thu:
- [ ] Test: cùng seed + cùng danh sách → cùng kết quả; đổi thứ tự đầu vào → vẫn cùng kết quả.
- [ ] Test phân bố: 10.000 lần quay với seed khác nhau, mỗi người trúng xấp xỉ đều (sai lệch < 5%).

---

## Task 13.2 – Màn quay số trực tiếp

Làm (theo màn "Quay số" của mockup):
- BCN: `/admin/draws/[id]`: chọn nguồn → tạo danh sách tham gia (bỏ tick người không hợp lệ) → chốt (sinh `seed_commit`) → **Bắt đầu** → quay từng giải (bấm "Quay giải tiếp theo").
- Thành viên: `/draws/[id]`: thấy danh sách tham gia, mã commit, và **hiệu ứng vòng quay/cuộn tên đồng bộ** với BCN qua Supabase Realtime (broadcast channel `draw:{id}`): server tính người trúng trước rồi phát sự kiện `{ prizeId, winnerId, revealAt }`; client chạy hiệu ứng 4–6 giây rồi dừng đúng người trúng ở `revealAt`, để mọi máy dừng cùng lúc.
- Người vào trễ thấy kết quả đã quay.
- Hiệu ứng làm bằng CSS/SVG, không thư viện; chạy mượt với 300 tên (cuộn tên dạng "máy đánh bạc" thay vì vòng tròn chia 300 lát).

Nghiệm thu:
- [ ] 3 điện thoại cùng mở: BCN bấm quay → cả 3 máy chạy hiệu ứng và dừng ở cùng một tên, lệch không quá 1 giây.
- [ ] Tải lại trang giữa chừng → thấy đúng các giải đã quay.

---

## Task 13.3 – Kết quả và trao thưởng

Làm:
- Quay xong: lộ `seed_reveal`, lưu kết quả, tạo `rewards` (08) cho người trúng, tạo bài kết quả trên bảng tin (10).
- Huỷ quay giữa chừng: bắt buộc lý do, hiện công khai trên trang quay số.

Nghiệm thu:
- [ ] Trang verify chạy lại ra đúng người trúng với seed đã lộ.
- [ ] Người trúng thấy giải trong danh sách thưởng của mình.

---

## Câu hỏi cho BCN
- Người hoàn thành nhiều hơn chỉ tiêu có được **nhiều phiếu** hơn (weight) không?
- Người đang nợ phạt có được tham gia quay số không?
