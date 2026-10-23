# 04 – Thành viên, theo dõi nhau, khung /admin

Mục tiêu: BCN duyệt người mới, phân loại chính thức / tự do, quản lý trạng thái. Thành viên tìm và theo dõi nhau.

Thứ tự: 4.1 → 4.2 → 4.3 → 4.4.

---

## Task 4.1 – Khung /admin

Làm:
- `src/app/admin/layout.tsx`: kiểm `is_bcn()` ở server, không phải BCN → 404 (không lộ là có trang admin).
- Layout desktop-first nhưng dùng được trên điện thoại: menu trái (thu gọn thành ngăn kéo trên mobile), theo mockup trang admin.
- Menu lấy từ `src/config/adminNav.ts`, mục nào chưa có tính năng thì `enabled: false`.
- Trang `/admin` tổng quan tạm: số thành viên active, số chờ duyệt, hoạt động 7 ngày qua.
- Hàm `logAudit(action, table, id, before, after)` dùng cho mọi thao tác BCN đổi dữ liệu người khác.

Nghiệm thu:
- [ ] Member thường mở `/admin` → 404. BCN mở → thấy tổng quan.
- [ ] Gọi thẳng Server Action admin bằng tài khoản member (DevTools) → bị từ chối ở DB.

---

## Task 4.2 – Duyệt và quản lý thành viên

Làm:
- `/admin/members`: tab **Chờ duyệt / Đang hoạt động / Ngưng / Từ chối**. Tìm theo tên, lọc theo loại, giới tính.
- Duyệt: chọn loại `official` / `free`, bấm Duyệt → `status = active`, `role = member`, sinh `member_code` (`CLR` + số tăng dần 4 chữ số), `joined_at = now()`. Duyệt nhiều người một lúc.
- Từ chối: kèm lý do (người đó thấy trên `/pending`).
- Trang chi tiết thành viên: thông tin, đổi loại, đổi vai trò (chỉ `bcn` mới gán `bcn`/`treasurer`), chuyển `inactive` (nghỉ CLB: không đăng nhập được khu thành viên, không bị tính challenge, dữ liệu giữ nguyên).
- Lịch sử thay đổi (đọc `audit_logs` của thành viên đó).
- Xuất CSV danh sách thành viên.

Nghiệm thu:
- [ ] Đăng nhập tài khoản mới → hiện ở "Chờ duyệt" → duyệt là `official` → tài khoản đó vào được trang chủ, có `member_code`.
- [ ] Chuyển `inactive` → người đó bị đưa về trang thông báo "Tài khoản đã ngưng".
- [ ] Mọi thao tác trên có dòng `audit_logs`.

---

## Task 4.3 – Danh bạ thành viên + theo dõi nhau

Làm:
- Bảng `follows (follower_id, followee_id, created_at, pk(follower_id, followee_id))`, check không tự theo dõi mình. RLS: ai cũng đọc; chỉ chính mình thêm/xoá dòng có `follower_id = auth.uid()`.
- `/members`: danh sách thành viên active (ảnh, tên, loại, level), tìm theo tên. Mỗi người có nút Theo dõi / Bỏ theo dõi.
- `/members/[id]`: hồ sơ công khai (xem `05`), số người theo dõi / đang theo dõi.
- Trang chủ có khối "Bạn bè gần đây": hoạt động mới nhất của người mình theo dõi (qua `activities_club`, tôn trọng quyền chia sẻ ở task 3.0).

Nghiệm thu:
- [ ] A theo dõi B → B không cần đồng ý (theo dõi một chiều, giống Strava). A thấy hoạt động mới của B ở trang chủ.
- [ ] B tắt chia sẻ số liệu → A vẫn thấy B trong danh bạ nhưng không thấy hoạt động.

---

## Task 4.4 – Trang thông tin thành viên tự quản

Làm:
- `/me/settings`: sửa tên hiển thị, SĐT, giới tính, năm sinh, quyền chia sẻ số liệu, quyền cộng hoạt động riêng tư vào tổng, ngắt kết nối Strava (2.3).
- Thành viên thấy mình là chính thức hay tự do, mã thành viên, ngày vào CLB.

Nghiệm thu:
- [ ] Sửa tên → tên mới hiện ở danh bạ và bảng xếp hạng.

---

## Quyết định tạm
- Thành viên **chính thức** bắt buộc tham gia challenge tháng (tự động ghi danh) và chịu phạt nếu không đạt. Thành viên **tự do** tự chọn tham gia, không bị phạt challenge bắt buộc. Đổi được ở từng challenge (07).
- Không có cấp "nhóm/đội" trong MVP. Nếu CLB có chia đội, thêm ở V2.

## Câu hỏi cho BCN
- Điều kiện để thành **chính thức** là gì (đóng quỹ, chạy đủ X km, thời gian thử việc)? Có cần app tự đề xuất "đủ điều kiện lên chính thức" không?
- CLB có chia **nhóm/đội** (theo khu vực, theo pace) không?
