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

> - Kiểu DB (2026-10-24): `npm run db:types` giờ ghi `src/lib/types/database.generated.ts` (sinh từ `supabase start` local, không còn bản viết tay). `src/lib/types/database.ts` là lớp thu hẹp: các cột text có check constraint (`role`, `status`, `member_type`, `gender`, `visibility`, `backfill_jobs.status`, `window_name`) thành union literal, `start_latlng` thành `string | null`, `set_activity_flag.p_reason` nhận `null`. Không chuyển sang Postgres enum (xem PR). Thêm giá trị vào check constraint thì phải sửa union tương ứng.

### 02 – Đăng nhập Strava
- [x] 2.1 Bảng members + strava_tokens
- [~] 2.2 OAuth start + callback ⚠️
- [~] 2.3 Thu hồi quyền
- [x] 2.4 Hồ sơ lần đầu

> Ghi chú task 2 (làm 2.1 + 2.2, chưa làm 2.3 và 2.4):
> - Chưa chạy được với Docker/Supabase thật và chưa test với Strava thật: mới chạy typecheck/lint/test/build. Các mục Nghiệm thu của 2.1/2.2 cần test tay sau khi có app Strava + project `clr-preview`. Cần chạy `supabase db push` migration `0002_members.sql` và `npm run db:types` (hiện `database.ts` vẫn viết tay).
> - Biến `APP_URL` (server, không `NEXT_PUBLIC_`) thay `NEXT_PUBLIC_APP_URL`. Biến mới: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `TOKEN_ENC_KEY`.
> - Next 16 đổi `middleware` thành `src/proxy.ts`. Proxy chỉ làm mới phiên và đẩy người chưa đăng nhập về `/login`; kiểm `status != active` làm ở layout `(app)` (`requireActiveMember`) để proxy không phải query DB mỗi request.
> - Phiên: `admin.createUser` (lần đầu) + `generateLink` + `verifyOtp` (type `email`) đúng cách đã chọn trong plan. Đã tắt `enable_signup` trong `supabase/config.toml` (admin API vẫn tạo được user); production cần tắt tay trong Dashboard.
> - `is_bcn()` chỉ true khi `role = 'bcn'` và `status = 'active'`; `is_treasurer()` tương tự với `treasurer`. Nếu thủ quỹ cũng phải có quyền BCN thì cần chỉnh.
> - Thành viên tự sửa được `display_name, phone, city, birth_year, gender, share_private_in_totals`; cột quyền hạn do trigger `members_guard_privileged_columns` chặn (BCN và service role vượt qua). Thêm policy ghi `settings` cho BCN và key `zalo_group_url` (rỗng thì ẩn link ở `/pending`).
> - Bước 6 của luồng (đưa vào hàng đợi kéo lịch sử) chưa có, làm ở task 3.4.
> - Nút "Connect with Strava" chính thức (`public/strava/btn_strava.png`, do CoT thêm) đã dùng ở `/login`.
> - Migration production tự chạy khi merge vào `main` (`.github/workflows/migrate-production.yml`, cần 3 secret ghi trong README). Preview vẫn chạy tay.
> - Task 2.4: thêm cột `members.profile_onboarded_at` (migration `0003`). Layout `(app)` chuyển người chưa có giá trị này sang `/welcome` (form tên, giới tính, năm sinh, SĐT); bấm Lưu hoặc "Để sau" đều ghi mốc nên form chỉ hiện một lần. Sửa lại ở `/me/settings` (trang này mới có form hồ sơ, 2.3 và 4.4 sẽ thêm phần còn lại). Luật kiểm tra đầu vào ở `src/lib/members/profileInput.ts`, ngưỡng ở `src/config/profile.ts`. Chưa test tay trên DB thật.
> - Ghi chú điều khoản Strava: không được hiển thị dữ liệu Strava của người này cho người khác (xem task 3.0 và `plans/strava-permission-email.md`). Task này chỉ lưu hồ sơ và token, chưa hiện số liệu của ai cho ai.

### 03 – Đồng bộ Strava
- [~] 3.0 Đọc điều khoản, chốt cách hiển thị ⚠️
- [~] 3.1 Bảng activities
- [~] 3.2 Client Strava + token + rate limit ⚠️
- [~] 3.3 Webhook ⚠️
- [~] 3.4 Kéo lịch sử ⚠️
- [~] 3.5 Luật hợp lệ
- [~] 3.6 Theo dõi đồng bộ cho BCN
- [ ] Gửi đơn xin Strava duyệt app (việc của BCN, làm ngay khi 3.3 chạy được)

> Ghi chú task 3 (làm 3.0 → 3.6 và 2.3 trong một phiên; chỉ chạy typecheck/lint/test/build, **chưa** test với DB và Strava thật nên các mục Nghiệm thu chưa tick):
> - **3.0 điều khoản** (đọc `strava.com/legal/api` ngày 2026-10-23): mục 2 ghi dữ liệu Strava của một người "chỉ được hiển thị trong app cho chính người đó"; dữ liệu segment và leaderboard cũng là Strava Data; chia sẻ cho người khác cần "explicit consent" nhưng không mô tả cơ chế. Bản đồ, hạn xoá sau khi thu hồi quyền và logo "Powered by Strava" không có trong trang này (logo theo Brand Guidelines riêng). Vì vậy giữ phương án đã đề xuất: opt-in `members.share_stats_with_club` (tick ở `/me/settings`), bản đồ chỉ hiện cho chính chủ, cờ `settings.club_display_mode` quyết định hiển thị ở 06/07. **CoT vẫn cần chốt phương án A–E và gửi email xin phép Strava** (câu hỏi #9).
> - Migration `0004_strava_sync.sql`: `activities` (cột `counts_for_club` sinh tự động = `passes_rules and not flagged_invalid`), `activity_best_efforts`, `strava_rate_state`, `strava_events`, `backfill_jobs`, view `activities_club` (không tên hoạt động, polyline, raw; chỉ người đã opt-in, bỏ hoạt động riêng tư) và `activities_review` (chỉ BCN, bỏ hoạt động riêng tư), hàm `set_activity_flag` (BCN đánh dấu, ghi `audit_logs`). `database.ts` vẫn viết tay.
> - Token: không khoá dòng; làm mới xong ghi theo kiểu so sánh-và-ghi (`saveIfUnchanged`), thua cuộc đua thì đọc lại token mới. Refresh trả 400/401 thì coi như thu hồi: xoá token, dữ liệu và job như 2.3.
> - Hạn mức: ngưỡng ở `src/config/strava.ts` (việc nền dùng tối đa 80% cửa sổ 15 phút và 70% hạn mức ngày, webhook dùng tới 100%). Cửa sổ căn theo UTC (15 phút tròn, nửa đêm UTC).
> - Webhook `POST` chỉ ghi `strava_events` (trùng event thì bỏ qua) rồi xử lý ngay bằng `after()`; GitHub Actions (`.github/workflows/strava-cron.yml`, mỗi 5 phút và mỗi 15 phút) gọi `/api/cron/strava-events` và `/api/cron/backfill` làm lưới an toàn. Không dùng Vercel Cron vì gói miễn phí chỉ cho chạy theo ngày.
> - Kéo lịch sử: job tự tạo cho thành viên `active` + đã kết nối (cron tạo nếu thiếu, nên không phụ thuộc task 4.2), mỗi lần chạy một trang 200 hoạt động cho mỗi job, bản tóm tắt không ghi đè hoạt động đã có. Sau đó lấy best efforts cho tối đa 20 hoạt động chạy chưa có chi tiết, mới nhất trước.
> - 2.3: `/me/settings` có "Ngắt kết nối Strava" (gọi `oauth/revoke`, xoá token, hoạt động, job, rồi đăng xuất) và "Xoá toàn bộ dữ liệu Strava của tôi" (xoá hoạt động, dừng kéo lịch sử, vẫn nhận hoạt động mới). Webhook `athlete update authorized=false` làm như ngắt kết nối.
> - 3.5: luật ở `src/config/activityRules.ts` (Run, TrailRun, VirtualRun; không nhập tay; pace nhanh nhất 2:50/km). Hoạt động không có quãng đường thì không tính. BCN chỉ **loại** thêm được hoạt động (cờ `flagged_invalid`), chưa có cách ép tính một hoạt động mà luật đã loại. Đổi luật xong chưa có nút tính lại `passes_rules` cho dữ liệu cũ.
> - `/admin/*` mới có khung tối thiểu (`src/app/admin/layout.tsx`, chặn bằng `requireBcn`) để chứa `/admin/activities` và `/admin/sync`; task 4.1 sẽ thay bằng khung đầy đủ. Hook `onActivitiesChanged` ở `src/lib/strava/hooks.ts` đang rỗng, chờ task 6 và 7.
> - Biến môi trường mới: `STRAVA_WEBHOOK_VERIFY_TOKEN`, `CRON_SECRET`; secret GitHub mới: `APP_URL`, `CRON_SECRET`. Script `npm run strava:subscribe -- create|list|delete <id>`.

### 04 – Thành viên
- [~] 4.1 Khung /admin
- [~] 4.2 Duyệt và quản lý thành viên
- [~] 4.3 Danh bạ + theo dõi nhau
- [~] 4.4 Cài đặt cá nhân

> Ghi chú task 4 (làm 4.1 → 4.4 trong một phiên; đã chạy typecheck/lint/test/build và thử migration `0005` bằng Postgres 16 cục bộ với auth giả, **chưa** test tay trên app thật nên Nghiệm thu chưa tick):
> - Migration `0005_members_admin.sql`: cột `members.rejection_reason` (thêm vào nhóm cột chỉ BCN sửa), `members_public` thêm `joined_at`, policy BCN đọc `audit_logs`, hàm `log_audit`, `admin_review_members` (duyệt/từ chối nhiều người), `admin_update_member` (đổi loại/vai trò/trạng thái), bảng `follows` + RLS. Mọi thay đổi dữ liệu người khác đi qua hàm security definer kiểm `is_bcn()` và ghi `audit_logs` cùng giao dịch; BCN không tự đổi vai trò hoặc trạng thái của chính mình (tránh khoá mất BCN cuối).
> - `database.generated.ts` được sửa tay theo migration 0005 vì máy làm việc không có Docker; chạy `npm run db:types` để sinh lại khi có DB.
> - `/admin` (4.1): người không phải BCN nhận 404 (đúng plan; `requireBcn` dùng `notFound()`, route CSV tự trả 404). Menu ở `src/config/adminNav.ts` (mục chưa làm `enabled: false`), mobile là ngăn kéo. Tổng quan đếm thành viên active, chờ duyệt, hoạt động 7 ngày được tính (qua `activities_review`, không gồm hoạt động riêng tư). `logAudit` (TS) dùng cho xuất CSV; các thao tác duyệt/đổi thành viên ghi audit ngay trong hàm SQL.
> - `member_code` đã được sinh lúc người đó đăng nhập lần đầu (migration 0002), nên duyệt không sinh lại; mã có thể nhảy số nếu có người bị từ chối.
> - Thành viên bị `inactive` bị đưa về `/pending` với dòng "Tài khoản đã ngưng". Người bị từ chối thấy lý do ở `/pending`.
> - Xuất CSV chứa SĐT và năm sinh; ô bắt đầu bằng `= + - @` được thêm dấu `'` để tránh công thức Excel (số `+84...` cũng thành `'+84...`). Mỗi lần xuất ghi một dòng audit.
> - 4.3: khối "Bạn bè gần đây" ở trang chủ chỉ hiện khi `settings.club_display_mode = 'full_opt_in'` (mặc định `self_only`, chưa chốt câu hỏi #9) và chỉ lấy từ `activities_club` (người đã bật chia sẻ). Hồ sơ công khai `/members/[id]` mới có tên, loại, ngày vào, số người theo dõi; phần còn lại chờ task 5.4. Danh bạ chưa có level (chờ task 6.2).
> - 4.4: `/me/settings` thêm tick cộng hoạt động riêng tư vào tổng (`share_private_in_totals`) và khối mã thành viên, loại, ngày vào. CoT đã trả lời câu hỏi BCN: BCN tự nhấn nút đổi loại (đã có ở trang chi tiết), không cần tự đề xuất; chưa chia nhóm/đội.

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
| 4 | Điều kiện lên thành viên chính thức | 04 | 4.2 | Có điều kiện, nhưng BCN tự xét và nhấn nút đổi loại; app không cần tự đề xuất (CoT, 2026-10-24) |
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

### 2026-10-24 – CoT
- `/admin` ra 404; các action (cập nhật hồ sơ...) bấm xong không có thông báo.
  → Đã xử lý: 404 do chưa có `src/app/admin/page.tsx` (task 3 chỉ có `/admin/activities` và `/admin/sync`; không phải do kiểm tra quyền, `requireBcn` chuyển người không phải BCN về `/`). Thêm trang `/admin` và link "Trang quản trị BCN" ở `/me` cho BCN. Thêm toast dùng chung (`ToastProvider`, `ActionForm`, cookie `clr_flash` cho action có redirect) và gắn vào form hồ sơ, tuỳ chọn chia sẻ, xoá dữ liệu/ngắt kết nối Strava, các action admin.

### 2026-10-23 – CoT
- Chốt plan. Theme xanh lấy từ logo CLB; mockup Trang chủ theme xanh làm chuẩn màu.
  → Đã xử lý: thêm link mockup vào `plans/00-overview.md`, merge PR #1.
- Coding style: viết code dễ đọc, theo single responsibility, ít comment inline.
  → Đã xử lý: ghi vào mục "Coding style" trong `CLAUDE.md`.
