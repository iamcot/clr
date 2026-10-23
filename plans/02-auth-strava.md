# 02 – Đăng nhập bằng Strava ⚠️

Mục tiêu: thành viên chỉ cần bấm "Kết nối với Strava" là vào app. Không mật khẩu, không email. Session là session Supabase thật để RLS (`auth.uid()`) hoạt động.

Thứ tự: 2.1 → 2.2 → 2.3 → 2.4.

---

## Luồng tổng

```
/login  ──bấm──▶  /api/auth/strava/start
                  (tạo state ngẫu nhiên, lưu cookie httpOnly 10 phút)
                  302 → https://www.strava.com/oauth/authorize
                        ?client_id&redirect_uri&response_type=code
                        &approval_prompt=auto&scope=read,activity:read_all&state
Strava  ──302──▶  /api/auth/strava/callback?code&scope&state
                  1. so state với cookie
                  2. POST https://www.strava.com/oauth/token (code → access_token, refresh_token, expires_at, athlete)
                  3. kiểm scope có activity:read_all (thiếu thì về /login?error=scope)
                  4. upsert members theo strava_athlete_id, upsert strava_tokens
                  5. tạo/tìm user Supabase tương ứng, mở session (xem 2.2)
                  6. thành viên mới → đưa vào hàng đợi kéo lịch sử (03)
                  7. redirect: status = pending → /pending, active → /
```

---

## Task 2.1 – Bảng members + strava_tokens

Làm (migration mới):
- `members`:
  - `id uuid pk` = `auth.users.id`
  - `strava_athlete_id bigint unique not null`
  - `display_name text`, `avatar_url text`, `gender text check in ('M','F','X')`, `birth_year int`, `city text`, `phone text`
  - `role text not null default 'guest' check in ('guest','member','bcn','treasurer')`
  - `member_type text check in ('official','free')` (null khi còn guest)
  - `status text not null default 'pending' check in ('pending','active','inactive','rejected')`
  - `member_code text unique` (mã ngắn, ví dụ `CLR0123`, dùng cho nội dung chuyển khoản ở V3)
  - `share_private_in_totals bool not null default false`
  - `strava_connected bool not null default true`
  - `joined_at`, `created_at`, `updated_at`
- `strava_tokens`: `member_id pk fk`, `access_token text`, `refresh_token text`, `expires_at timestamptz`, `scope text`, `updated_at`. Token mã hoá ở tầng app (AES-256-GCM, khoá `TOKEN_ENC_KEY` trong env) trước khi ghi.
- RLS:
  - `members`: ai đăng nhập cũng `select` được các cột công khai qua view `members_public` (id, display_name, avatar_url, member_type, gender). Bảng gốc: chính mình `select/update` một số cột (display_name, phone, city, birth_year, gender, share_private_in_totals); BCN `select/update` tất cả.
  - `strava_tokens`: **không policy nào** cho anon/authenticated. Chỉ service role.
- Hàm SQL `is_bcn()` / `is_treasurer()` (`security definer`, đọc role của `auth.uid()`), dùng lại ở mọi policy sau này.
- `src/lib/crypto/tokenBox.ts` (`seal`, `open`) + test.

Nghiệm thu:
- [ ] Dùng client thường (đăng nhập user A): đọc `strava_tokens` trả về rỗng; sửa `role` của chính mình bị từ chối.
- [ ] Test `tokenBox`: mã hoá rồi giải mã ra đúng chuỗi; sửa 1 byte thì giải mã báo lỗi.

---

## Task 2.2 – OAuth start + callback ⚠️

Làm:
- `src/app/api/auth/strava/start/route.ts` và `callback/route.ts` theo luồng trên.
- `src/lib/strava/oauth.ts`: `buildAuthorizeUrl`, `exchangeCode`, `refreshToken` (hàm thuần nhận `fetch` để test).
- Tạo session Supabase cho user (cách được chọn, **quyết định tạm**):
  1. Lần đầu: `auth.admin.createUser({ email: 'strava_<athleteId>@users.clr.local', email_confirm: true, user_metadata: { strava_athlete_id } })`.
  2. Mỗi lần đăng nhập: `auth.admin.generateLink({ type: 'magiclink', email })` lấy `hashed_token`, rồi ở server gọi `supabase.auth.verifyOtp({ type: 'magiclink', token_hash })` bằng server client có cookie → Supabase tự set cookie session.
  - Email giả không bao giờ nhận thư; tắt gửi email trong Supabase Auth.
  - Nếu cách này bị chặn ở bản Supabase hiện hành: dừng và báo, cách dự phòng là ký JWT riêng bằng khoá JWT của project.
- Trang `/login`: nút "Connect with Strava" **đúng ảnh chính thức** của Strava (tải từ brand guideline, để ở `public/strava/`), dòng giải thích ngắn app đọc gì.
- Trang `/pending`: "Đang chờ BCN duyệt", hiện tên + ảnh Strava, link nhóm Zalo (từ `settings`).
- `src/middleware.ts` (hoặc `proxy.ts` tuỳ bản Next): làm mới session Supabase; chặn khu `(app)` khi chưa đăng nhập; `status != active` → `/pending`.
- Đăng xuất: `/api/auth/logout` xoá session (không thu hồi token Strava).

Nghiệm thu:
- [ ] Đăng nhập bằng tài khoản Strava thật: tạo dòng `members` status `pending`, vào `/pending`.
- [ ] Ở Supabase Studio đổi `status = active`, `role = member`, tải lại: vào trang chủ.
- [ ] Sửa tay tham số `state` trên URL callback → báo lỗi, không đăng nhập.
- [ ] Bỏ tick quyền "View data about your private activities" ở màn Strava → về `/login` kèm thông báo cần cấp quyền.
- [ ] Đăng xuất rồi đăng nhập lại: cùng `members.id`, không tạo user mới.

Pitfall:
- Strava trả `scope` thực tế người dùng chấp nhận qua query `scope` của callback, không phải scope mình xin.
- `redirect_uri` phải nằm trong "Authorization Callback Domain" của app Strava. Preview deploy của Vercel đổi domain liên tục: dùng một domain preview cố định hoặc app Strava riêng cho dev.

---

## Task 2.3 – Thu hồi quyền (deauthorize)

Làm:
- Khi webhook Strava báo `aspect_type = update`, `object_type = athlete`, `updates.authorized = 'false'` (xử lý trong `03`): xoá `strava_tokens`, đặt cờ `members.strava_connected = false`, giữ dữ liệu hoạt động đã đồng bộ hay xoá theo **quyết định tạm** dưới đây.
- Trang `/me/settings`: nút "Ngắt kết nối Strava" gọi `POST https://www.strava.com/oauth/deauthorize`, và nút "Xoá toàn bộ dữ liệu Strava của tôi" (xoá activities + best efforts của mình).

Quyết định tạm:
- Ngắt kết nối thì **xoá luôn hoạt động đã đồng bộ** của người đó (điều khoản Strava yêu cầu xoá dữ liệu khi người dùng thu hồi quyền). Thành tích giải nhập tay và lịch sử phạt vẫn giữ.

Nghiệm thu:
- [ ] Vào strava.com → Settings → My Apps → Revoke: trong vài phút `strava_tokens` của mình mất, hoạt động bị xoá, đăng nhập lại thì kết nối lại được.

---

## Task 2.4 – Hồ sơ lần đầu

Làm:
- Sau khi duyệt lần đầu (status chuyển `active`), lần vào app đầu tiên mở form ngắn: tên hiển thị (mặc định tên Strava), giới tính, năm sinh, số điện thoại (không bắt buộc). Giới tính + năm sinh dùng để chia hạng mục challenge và bảng vàng.

Nghiệm thu:
- [ ] Thành viên mới thấy form một lần, điền xong không thấy lại.
- [ ] Bỏ qua được (nút "Để sau"), sau đó sửa trong `/me/settings`.

---

## Câu hỏi cho BCN
- Có muốn thành viên **không có Strava** vẫn dùng được (đăng nhập Zalo/Google, nhập tay km) không? Plan hiện tại: **bắt buộc Strava**.
- Ai trong BCN đứng tên app Strava (nên là tài khoản Strava của CLB)?
