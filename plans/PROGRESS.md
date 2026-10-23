# Tiến độ

Đánh dấu `[x]` khi task xong và đã qua phần Nghiệm thu. `[~]` là làm một phần (ghi rõ còn thiếu gì). Ghi chú ngắn ngay dưới task nếu có quyết định quan trọng.

Cuối file là mục **Feedback**: người dùng ghi góp ý, Claude đọc trước mỗi phiên và ghi cách đã xử lý.

## MVP

### 01 – Khung dự án
- [x] 1.1 Khởi tạo Next.js
- [x] 1.2 Design token + layout khung
- [~] 1.3 Supabase
- [~] 1.4 Vercel + CI

> Ghi chú task 1 (làm gộp 1.1 → 1.4 trong một phiên):
> - Version đã ghim: next 16.4.2, react/react-dom 19.3.1, tailwindcss + @tailwindcss/postcss 4.3.3, typescript 5.9.3, eslint 9.39.5 + eslint-config-next 16.4.2, vitest 5.0.5, @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0, supabase CLI 2.122.0, server-only 0.0.1.
> - Máy làm việc chỉ có Node 22 và không có Docker: đã chạy typecheck/lint/test/build, **chưa** chạy `supabase start` / `db reset` và chưa test kết nối thật. `src/lib/types/database.ts` đang viết tay, cần chạy `npm run db:types` sau khi có DB.
> - Tab Challenge/Event/Quỹ để `enabled: false` vì chưa có trang; bật lại ở `src/config/nav.ts` khi làm tới.
> - Còn thiếu để 1.3/1.4 xong hẳn: tạo project Supabase + Vercel, điền biến môi trường, kiểm tra PR thử có CI xanh và link preview.
> - Tên biến Supabase theo key mới: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

### 02 – Đăng nhập Strava
- [x] 2.1 Bảng members + strava_tokens
- [~] 2.2 OAuth start + callback ⚠️
- [ ] 2.3 Thu hồi quyền
- [ ] 2.4 Hồ sơ lần đầu

> Ghi chú task 2 (làm 2.1 + 2.2, chưa làm 2.3 và 2.4):
> - Chưa chạy được với Docker/Supabase thật và chưa test với Strava thật: mới chạy typecheck/lint/test/build. Các mục Nghiệm thu của 2.1/2.2 cần test tay sau khi có app Strava + project `clr-preview`. Cần chạy `supabase db push` migration `0002_members.sql` và `npm run db:types` (hiện `database.ts` vẫn viết tay).
> - Biến `APP_URL` (server, không `NEXT_PUBLIC_`) thay `NEXT_PUBLIC_APP_URL`. Biến mới: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `TOKEN_ENC_KEY`.
> - Next 16 đổi `middleware` thành `src/proxy.ts`. Proxy chỉ làm mới phiên và đẩy người chưa đăng nhập về `/login`; kiểm `status != active` làm ở layout `(app)` (`requireActiveMember`) để proxy không phải query DB mỗi request.
> - Phiên: `admin.createUser` (lần đầu) + `generateLink` + `verifyOtp` (type `email`) đúng cách đã chọn trong plan. Đã tắt `enable_signup` trong `supabase/config.toml` (admin API vẫn tạo được user); production cần tắt tay trong Dashboard.
> - `is_bcn()` chỉ true khi `role = 'bcn'` và `status = 'active'`; `is_treasurer()` tương tự với `treasurer`. Nếu thủ quỹ cũng phải có quyền BCN thì cần chỉnh.
> - Thành viên tự sửa được `display_name, phone, city, birth_year, gender, share_private_in_totals`; cột quyền hạn do trigger `members_guard_privileged_columns` chặn (BCN và service role vượt qua). Thêm policy ghi `settings` cho BCN và key `zalo_group_url` (rỗng thì ẩn link ở `/pending`).
> - Bước 6 của luồng (đưa vào hàng đợi kéo lịch sử) chưa có, làm ở task 3.4.
> - **Nút Strava chính thức chưa có**: không tải được ảnh từ trang brand guideline nên `/login` đang dùng nút chữ tạm. Cần BCN/CoT tải "Connect with Strava" vào `public/strava/` rồi thay (Strava yêu cầu dùng đúng nút này).
> - Ghi chú điều khoản Strava: không được hiển thị dữ liệu Strava của người này cho người khác (xem task 3.0 và `plans/strava-permission-email.md`). Task này chỉ lưu hồ sơ và token, chưa hiện số liệu của ai cho ai.

### 03 – Đồng bộ Strava
- [ ] 3.0 Đọc điều khoản, chốt cách hiển thị ⚠️
- [ ] 3.1 Bảng activities
- [ ] 3.2 Client Strava + token + rate limit ⚠️
- [ ] 3.3 Webhook ⚠️
- [ ] 3.4 Kéo lịch sử ⚠️
- [ ] 3.5 Luật hợp lệ
- [ ] 3.6 Theo dõi đồng bộ cho BCN
- [ ] Gửi đơn xin Strava duyệt app (việc của BCN, làm ngay khi 3.3 chạy được)

### 04 – Thành viên
- [ ] 4.1 Khung /admin
- [ ] 4.2 Duyệt và quản lý thành viên
- [ ] 4.3 Danh bạ + theo dõi nhau
- [ ] 4.4 Cài đặt cá nhân

### 05 – Hồ sơ, PR, thành tích giải
- [ ] 5.1 PR tự động
- [ ] 5.2 Thành tích các giải
- [ ] 5.3 Trang "Tôi"
- [ ] 5.4 Hồ sơ công khai

### 06 – Thống kê, level
- [ ] 6.1 Bảng tổng hợp
- [ ] 6.2 Level ⚠️
- [ ] 6.3 Màn thống kê cá nhân
- [ ] 6.4 Xếp hạng CLB

### 07 – Challenge
- [ ] 7.1 Schema
- [ ] 7.2 Tính kết quả ⚠️
- [ ] 7.3 Admin tạo và quản lý
- [ ] 7.4 Màn cho thành viên
- [ ] 7.5 Chốt kỳ
- [ ] 7.6 Phân loại, sắp xếp, tổng hợp

### 08 – Thưởng phạt
- [ ] 8.1 Schema
- [ ] 8.2 Sinh tự động từ challenge
- [ ] 8.3 Admin thưởng phạt
- [ ] 8.4 Màn cho thành viên

### 09 – PWA
- [ ] 9.1 Manifest + icon + shortcut
- [ ] 9.2 Service worker
- [ ] 9.3 Hướng dẫn cài

## V2

### 10 – Bảng tin
- [ ] 10.1 Schema
- [ ] 10.2 Trang chủ = bảng tin
- [ ] 10.3 Admin bài viết
- [ ] 10.4 Bài tự sinh

### 11 – Event + album
- [ ] 11.1 Schema
- [ ] 11.2 Màn event
- [ ] 11.3 Điểm danh + gắn hoạt động
- [ ] 11.4 Upload ảnh R2 ⚠️
- [ ] 11.5 Album
- [ ] 11.6 Thống kê event

### 12 – Bảng vàng
- [ ] 12.1 Kỷ lục CLB
- [ ] 12.2 Danh hiệu và cột mốc
- [ ] 12.3 Trang bảng vàng

### 13 – Quay số
- [ ] 13.1 Schema + thuật toán
- [ ] 13.2 Màn quay trực tiếp
- [ ] 13.3 Kết quả và trao thưởng

### 14 – Thông báo đẩy
- [ ] 14.1 Đăng ký nhận
- [ ] 14.2 Gửi thông báo
- [ ] 14.3 Admin gửi thông báo

### 15 – Liên kết, hỗ trợ
- [ ] 15.1 Trang liên kết (làm sớm được)
- [ ] 15.2 Quy chế CLB
- [ ] 15.3 Liên hệ BCN

## V3

### 16 – Quỹ + VietQR
- [ ] 16.1 Sổ quỹ
- [ ] 16.2 Mã VietQR
- [ ] 16.3 Webhook ngân hàng + đối soát ⚠️
- [ ] 16.4 Màn nộp phạt
- [ ] 16.5 Admin quỹ

### 17 – Báo cáo tài chính
- [ ] 17.1 Tổng hợp
- [ ] 17.2 Trang công khai
- [ ] 17.3 Báo cáo cho BCN

---

## Câu hỏi đang chờ BCN trả lời

Gom từ mục "Câu hỏi cho BCN" của các file plan. Trả lời xong thì ghi câu trả lời vào đây (hoặc vào Feedback) và Claude sẽ sửa plan.

| # | Câu hỏi | Plan | Cần trước task | Trả lời |
|---|---|---|---|---|
| 1 | Tên miền, tài khoản đứng tên Vercel/Supabase/Cloudflare/Strava | 01, 02 | 1.4, 2.2 | |
| 2 | Bắt buộc có Strava mới dùng được app? | 02 | 2.2 | |
| 3 | Challenge có tính chạy máy, đi bộ không? | 03, 07 | 3.5 | |
| 4 | Điều kiện lên thành viên chính thức | 04 | 4.2 | |
| 5 | Công thức level | 06 | 6.2 | |
| 6 | Luật challenge tháng hiện tại (gửi mẫu) | 07 | 7.2 | |
| 7 | Mức phạt từng lỗi, có công khai danh sách nợ không | 08 | 8.1 | |
| 8 | Ngân hàng của tài khoản quỹ, ai là thủ quỹ | 16 | 16.1 | |
| 9 | Chọn cách hiển thị số liệu Strava cho người khác (A–E trong task 3.0), ai gửi email xin phép Strava | 03 | 6.4, 7.4 | |

---

## Feedback

Cách ghi: thêm một mục mới ở **trên cùng**, ghi ngày, người góp ý, nội dung. Claude xử lý xong thì ghi "→ Đã xử lý: ..." ngay dưới.

```
### 2026-10-24 – CoT
- Nội dung góp ý...
  → Đã xử lý: sửa plans/07-challenges.md task 7.2 (...)
```

### 2026-10-23 – CoT
- Chốt plan. Theme xanh lấy từ logo CLB; mockup Trang chủ theme xanh làm chuẩn màu.
  → Đã xử lý: thêm link mockup vào `plans/00-overview.md`, merge PR #1.
- Coding style: viết code dễ đọc, theo single responsibility, ít comment inline.
  → Đã xử lý: ghi vào mục "Coding style" trong `CLAUDE.md`.
