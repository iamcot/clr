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
- [~] 5.1 PR tự động
- [~] 5.2 Thành tích các giải
- [~] 5.3 Trang "Tôi"
- [~] 5.4 Hồ sơ công khai

> Ghi chú task 5 (làm 5.1 → 5.4 trong một phiên; đã chạy typecheck/lint/test và thử migration `0006` cùng RLS bằng Postgres 16 cục bộ với auth giả, **chưa** test tay trên app và Strava thật nên Nghiệm thu chưa tick):
> - Migration `0006_profile_pr.sql`: hàm `is_active_member()`, bảng `pr_overrides`, `races`, `race_results`, view `member_prs` (PR Strava của chính mình, `security_invoker`), `member_prs_club` (chỉ người đã bật chia sẻ, bỏ hoạt động riêng tư), `race_results_review` và hàm `admin_verify_race_result` (BCN xác minh, ghi `audit_logs`). Sửa kết quả giải sau khi BCN xác minh thì mất dấu xác minh (trigger). `database.generated.ts` sửa tay theo migration vì máy làm việc không có Docker; chạy `npm run db:types` để sinh lại.
> - PR lấy tên best effort Strava không phân biệt hoa thường (`src/config/prDistances.ts`); chỉ tính hoạt động `counts_for_club`. Override (thời gian chip, nguồn `race`) được ưu tiên; nút "Dùng PR Strava" gỡ override. Chưa có form nhập override thủ công ngoài đường "Dùng làm PR" từ kết quả giải.
> - Kết quả giải và PR override là dữ liệu nhập tay nên thành viên khác xem được (hồ sơ công khai, `/members/[id]`). PR từ Strava của người khác chỉ hiện khi `club_display_mode = 'full_opt_in'` **và** người đó bật chia sẻ. Hồ sơ công khai chưa có số km/pace tổng (chờ task 6).
> - Giấy chứng nhận hiện chỉ nhận link (chờ upload R2 ở task 11.4). Giải dùng chung: gõ trùng tên (không phân biệt hoa thường) và ngày thì dùng lại giải đã có; gõ tên có gợi ý qua `datalist`.
> - `/me`: km tháng/năm, số buổi, pace tháng tính trực tiếp từ `activities` (task 6 sẽ thay bằng bảng tổng hợp). Level hiện "chưa có"; khối Challenge/tiền phạt chưa làm vì task 7, 8 chưa có. Bản đồ nhỏ vẽ SVG từ `summary_polyline`, chỉ hiện cho chính chủ. Có "Powered by Strava" dạng chữ và link "View on Strava"; logo chính thức chưa thêm.
> - `/admin/races` để BCN xác minh kết quả giải.

### 06 – Thống kê, level
- [~] 6.1 Bảng tổng hợp
- [~] 6.2 Level ⚠️
- [~] 6.3 Màn thống kê cá nhân
- [~] 6.4 Xếp hạng CLB

> Ghi chú task 6 (làm 6.1 → 6.4 trong một phiên; đã chạy typecheck/lint/test/build và thử migration `0007` bằng Postgres 16 cục bộ với auth giả, **chưa** test tay trên app thật nên Nghiệm thu chưa tick):
> - Migration `0007_stats_level.sql`: bảng `member_stats_period` (tuần/tháng/năm/all, tuần bắt đầu thứ Hai giờ VN, kỳ `all` dùng `period_start = 1970-01-01`), hàm `refresh_member_stats(id)` và `refresh_all_member_stats()` (chỉ service role gọi), cột `members.level`, `club_points`, `level_updated_at` (thêm vào nhóm cột bị trigger chặn, thành viên không tự sửa được), view `club_rankings`. Cuối migration có `refresh_all_member_stats()` để điền sẵn bảng tổng hợp cho dữ liệu đang có. `database.generated.ts` sửa tay, chạy `npm run db:types` khi có Docker.
> - Cập nhật tổng hợp: hook `onActivitiesChanged` gọi tính lại thống kê + level của người đó (lỗi chỉ log, không làm hỏng đồng bộ); `set_activity_flag` và đổi tuỳ chọn `share_private_in_totals` tính lại ngay trong DB; ngắt kết nối/xoá dữ liệu Strava xoá thống kê và đặt level về 1. Job đêm `GET /api/cron/stats` (GitHub Actions 19:00 UTC = 02:00 VN, thêm vào `strava-cron.yml`, dùng secret có sẵn) tính lại cho mọi người. Không dùng `pg_cron` để level tính được bằng TypeScript.
> - Hoạt động riêng tư (`private` hoặc `only_me`) chỉ tính vào tổng khi `share_private_in_totals`. Chỉ tính `counts_for_club`.
> - **Level** (số tạm theo plan, sửa ở `src/config/levels.ts`): tính trên 12 tháng lịch gần nhất (tháng hiện tại và 11 tháng trước), nên có thể tụt khi nghỉ lâu. Level 4 cần PR half-marathon, level 5 cần PR marathon (PR Strava hoặc PR ghi đè). Điểm CLB = km×1 + ngày chạy×2 + challenge hoàn thành×50; challenge chưa có nên đang là 0 (task 7 nối vào `recomputeLevels`). Chưa có thông báo khi lên level (chờ task 10/14); mới ghi `level_updated_at`. Đổi số trong `levels.ts` xong bấm nút ở `/admin/stats` để áp dụng ngay.
> - Level là dữ liệu suy ra từ Strava nên theo luật 3.0: người khác chỉ thấy khi người đó bật chia sẻ **và** `club_display_mode = full_opt_in`.
> - `/me/stats`: tab tuần/tháng/năm, số buổi, km, thời gian, pace, độ cao, buổi dài nhất, ngày chạy, chuỗi ngày dài nhất, so với kỳ trước, biểu đồ cột SVG (chạm cột hiện số). Khối Challenge và phạt hiện "—" chờ task 7, 8. `/me` giờ đọc km tháng/năm từ bảng tổng hợp và hiện level.
> - `/rankings`: tab Tháng này / Năm nay / Level, lọc giới tính và loại thành viên, 50 dòng mỗi trang ("Xem thêm"), dòng của mình ghim cuối nếu ngoài trang. Chỉ có người đã bật chia sẻ; chế độ khác `full_opt_in` thì trang báo chưa mở. Chưa đo tải 600 dòng seed. Ranking đọc cả `club_rankings` (tối đa vài trăm dòng) rồi xếp ở server; nếu CLB vượt 1.000 người cần phân trang ở DB.
> - Hồ sơ công khai `/members/[id]` hiện level, km tháng/năm của người đã chia sẻ (cùng điều kiện trên). Link "Bảng xếp hạng" nằm ở trang chủ, chưa thêm tab vì tab bar cố định 5 mục.
> - Rate limit Strava: app đã nâng lên 10 VĐV. Code không giả định giới hạn 1 VĐV; hạn mức thật đọc từ header phản hồi của Strava và lưu ở `strava_rate_state` (các con số trong `DEFAULT_RATE_LIMITS` chỉ dùng trước khi có header đầu tiên), xem ở `/admin/sync`. Đã sửa ghi chú trong `plans/03-strava-sync.md`.

### 07 – Challenge
- [~] 7.1 Schema
- [~] 7.2 Tính kết quả ⚠️
- [~] 7.3 Admin tạo và quản lý
- [~] 7.4 Màn cho thành viên
- [~] 7.5 Chốt kỳ
- [~] 7.6 Phân loại, sắp xếp, tổng hợp

> Ghi chú task 7 (làm cùng 8, 9 trong một PR; đã chạy typecheck/lint/test/build và thử migration `0008` bằng Postgres 16 cục bộ với auth giả: công bố, tự ghi danh, tham gia, RLS, xếp hạng, chuyển trạng thái; **chưa** test tay trên app và Strava thật nên Nghiệm thu chưa tick):
> - Migration `0008_challenges.sql`: `challenges`, `challenge_categories`, `challenge_entries`, `challenge_entry_activities`, hàm `join_challenge`, `publish_challenge`, `pick_challenge_category`, `rank_challenge` (xếp hạng bằng `rank()` theo hạng mục), `advance_challenge_statuses`, trigger tự ghi danh khi thành viên được lên chính thức, bật Realtime cho `challenge_entries`. `database.generated.ts` sửa tay.
> - Điểm tính bằng hàm thuần `src/lib/challenges/score.ts` (có test): lọc buổi theo km tối thiểu, pace, môn, khung giờ, trần km mỗi ngày, rồi cộng theo loại mục tiêu. Mốc kỳ tính theo giờ Việt Nam. Hoạt động riêng tư chỉ tính khi thành viên bật `share_private_in_totals`. Tính lại khi hoạt động đổi (hook `onActivitiesChanged`) và khi BCN bấm "Tính lại tất cả".
> - Chuyển trạng thái chạy bằng GitHub Actions (job `challenges`, mỗi 15 phút, `GET /api/cron/challenges`), không dùng `pg_cron`. Qua `ends_at` + ân hạn thì sang `finalizing` và tính lại lần cuối. Chưa chốt thì chưa có phạt.
> - Người khác chỉ thấy bảng xếp hạng của những người đã bật chia sẻ khi `club_display_mode = full_opt_in` (cùng luật 3.0 với level). Chế độ khác thì thành viên chỉ thấy dòng của mình. Bảng xếp hạng tự làm mới khi có thay đổi (Realtime kích hoạt `router.refresh()` sau 1,5 giây), chưa test trên 2 điện thoại.
> - Giả định đã dùng cho câu hỏi #6 (chưa có luật thật từ BCN): ân hạn 48 giờ (`settings.challenge_grace_hours`); mục tiêu, km tối thiểu, pace do BCN nhập khi tạo challenge, form có sẵn mức phạt mẫu theo plan; không có challenge theo đội; mặc định chỉ tính Run/TrailRun/VirtualRun. BCN gửi luật tháng gần nhất thì tạo thành challenge mẫu ("Đặt làm challenge mẫu") để nhân bản sang tháng sau.
> - "Chốt kết quả" ở `/admin/challenges/[id]/results`: xem trước thưởng phạt, chốt rồi sinh khoản (chốt lại không nhân đôi nhờ unique), tính lại level. Xuất CSV kết quả (mỗi lần ghi audit). `/admin/challenges/summary`: số kỳ tham gia, hoàn thành, chuỗi tháng liên tiếp, lọc năm và loại thành viên, sắp xếp; chỉ tính challenge đã chốt. Điểm CLB nay cộng challenge hoàn thành đã chốt trong cửa sổ level.
> - Chưa làm: tạo bài thông báo kết quả (chờ task 10).

### 08 – Thưởng phạt
- [~] 8.1 Schema
- [~] 8.2 Sinh tự động từ challenge
- [~] 8.3 Admin thưởng phạt
- [~] 8.4 Màn cho thành viên

> Ghi chú task 8 (đã thử migration `0009` bằng Postgres 16 cục bộ: thành viên không tự đánh dấu đã nộp được, sửa tiền khoản đã nộp bị chặn, BCN đánh dấu nhiều khoản một lần, tổng minh bạch đúng; **chưa** test tay trên app):
> - Migration `0009_penalties_rewards.sql`: `penalty_types` (seed 5 loại), `penalties`, `rewards`, hàm `mark_penalties_paid`, `waive_penalties`, `unmark_penalty_paid`, `penalty_totals`, `can_manage_fund`. Đổi trạng thái sang đã nộp chỉ qua hàm kiểm `can_manage_fund()` (BCN hoặc thủ quỹ) và ghi `audit_logs`. Thành viên không có policy sửa nên không tự sửa được khoản của mình.
> - Mức phạt mặc định theo `src/config/penalties.ts` (số tạm: không đạt 100.000đ, dưới 50% 200.000đ, vắng event 50.000đ, vi phạm quy chế 100.000đ); BCN sửa mức theo từng challenge khi tạo. Không có phạt luỹ tiến (chờ BCN trả lời câu hỏi #7).
> - Công khai: theo quyết định tạm của plan, mọi thành viên xem được tổng phạt theo người trong tháng (không kèm lý do); BCN tắt được bằng tick ở `/admin/penalties` > "Tài khoản nhận phạt" (`settings.penalty_totals_public`). Thông tin tài khoản quỹ lưu ở `settings` (đọc được cả khi chưa đăng nhập vì `settings` đang cho đọc công khai); BCN nhập ở cùng chỗ.
> - `/admin/penalties`: lọc tháng/trạng thái/loại/tên, tổng đã thu/còn nợ/đã miễn, thêm phạt tay cho nhiều người, chọn nhiều khoản rồi "Đã nộp" (tiền mặt/chuyển khoản/VietQR, mã giao dịch) hoặc "Miễn" (bắt buộc lý do), huỷ trạng thái nộp (bắt buộc lý do, có log), xuất CSV. `/admin/rewards` đánh dấu đã trao. Trang `/admin` hiện chỉ cho `role = bcn`; thủ quỹ đã có quyền ở DB nhưng chưa có cổng vào `/admin`.
> - `/fund` (tab Quỹ): số nợ lớn, hướng dẫn nộp (số tài khoản, nội dung `CLR0123 PHAT T11`, nút sao chép có đường lùi cho iOS), danh sách khoản phạt và thưởng của mình, bảng tổng phạt tháng. Chưa test sao chép trên iPhone/Android thật.

### 09 – PWA
- [~] 9.1 Manifest + icon + shortcut
- [~] 9.2 Service worker
- [~] 9.3 Hướng dẫn cài

> Ghi chú task 9 (đã build thành công và `/manifest.webmanifest` được sinh; **chưa** thử cài trên Android/iPhone thật nên Nghiệm thu chưa tick):
> - Icon sinh bằng `node scripts/generateIcons.mjs` (dùng `sharp` có sẵn qua Next, không thêm dependency) từ phần vòng tròn trắng của logo: 192, 512, 512 maskable, apple-touch 180 và 6 ảnh splash iOS. Manifest ở `src/app/manifest.ts` kèm 3 shortcut. Meta iOS (`appleWebApp`, `startupImage`) ở `src/app/layout.tsx`. Thanh trạng thái iOS để `black-translucent` (nền header xanh đậm `deep`).
> - `public/sw.js` viết tay: cache-first cho `/_next/static`, icon, logo; network-first cho trang (điều hướng) có đường lùi về bản đã lưu hoặc trang chủ; không cache `/login` và `/api`. Phiên bản SW theo `?v=<commit sha>` (biến `NEXT_PUBLIC_BUILD_ID` trong `next.config.ts`), bản mới hiện thẻ "Có bản mới – Tải lại". Chỉ đăng ký ở production.
> - Giới hạn: chỉ trang tải đầy đủ (mở app, F5) được lưu; chuyển trang trong app khi offline chưa chạy vì đó là request RSC. Dải "Đang ngoại tuyến – số liệu lúc HH:mm" lấy giờ từ header do SW gắn vào bản lưu. Trang cá nhân bị cache (quyết định tạm của plan); cache bị xoá khi mở trang `/login` (sau đăng xuất hoặc hết phiên).
> - Thẻ cài ở trang chủ: Android bắt `beforeinstallprompt`; iPhone Safari hiện hướng dẫn 2 bước bằng chữ (chưa có hình); trình duyệt Zalo/Facebook hiện thẻ "Mở bằng Safari/Chrome" + nút sao chép link. Tắt thẻ nhớ 30 ngày bằng `localStorage`, không hiện khi đã chạy standalone.

### 18 – Hoạt động nhập tay (đề xuất 2026-10-24, làm sau task 9)
- [ ] 18.1 Schema
- [ ] 18.2 Màn thành viên
- [ ] 18.3 Màn BCN duyệt

---

## V2

### 10 – Bảng tin
- [~] 10.1 Schema
- [~] 10.2 Trang chủ = bảng tin
- [~] 10.3 Admin bài viết
- [~] 10.4 Bài tự sinh

> Ghi chú task 10 (đã chạy typecheck/lint/test/build; migration `0010` và các truy vấn chính được thử bằng Postgres 16 + PostgREST cục bộ với auth giả: thành viên chỉ thấy bài đã đăng, không tự đăng bài, không thả tim/đọc thay người khác, trả lời một cấp, BCN ẩn bình luận; **chưa** test tay trên app thật nên Nghiệm thu chưa tick):
> - Migration `0010_news_feed.sql`: `posts`, `post_reactions`, `post_comments`, `post_reads`, `level_changes` (trigger ghi mỗi lần đổi level, để làm bài tổng kết tuần), hàm `unread_post_count`, `delete_post_comment` (xoá mềm, chủ bình luận hoặc BCN; xoá bình luận gốc thì xoá luôn các trả lời), Realtime cho `post_comments`. `posts.published_at` null là bản nháp, tương lai là hẹn giờ (RLS chỉ cho thành viên thấy khi `published_at <= now()`, không cần job). BCN đọc được cả nháp/hẹn giờ qua RLS nên mọi truy vấn của thành viên lọc rõ `deleted_at`, `published_at` (cùng lỗi từng gây 404 ở challenge). `database.generated.ts` sửa tay.
> - Giả định cho câu hỏi BCN: **chỉ BCN đăng bài**, thành viên thả cảm xúc và bình luận. Ảnh bìa chỉ nhận link https (chưa có upload R2, chờ task 11.4). Chưa gửi thông báo đẩy khi đăng (chờ task 14).
> - Trang chủ: khối tóm tắt (km tháng, challenge đang chạy gần hết hạn nhất, tiền còn nợ), bài ghim tối đa 3 (có hạn ghim), bài mới nhất 20 bài mỗi lần (cuộn tới cuối tự tải thêm, có nút "Xem thêm"), bài cần xác nhận có nút "Đã đọc và đồng ý". Badge trên tab Trang chủ đếm bài đăng trong 30 ngày gần nhất mà mình chưa mở. `/posts/[id]`: markdown tự viết (`src/lib/markdown/parse.ts`, có test): tiêu đề, đậm, nghiêng, code, danh sách, trích dẫn, liên kết http/https/mailto hoặc đường dẫn nội bộ; không HTML thô, không ảnh; `<script>` hiện thành chữ. Bình luận tự làm mới sau khoảng 1,5 giây khi có người khác bình luận (Realtime kích hoạt tải lại dữ liệu trang), chưa test trên 2 điện thoại.
> - `/admin/posts`: soạn bài có xem trước, đăng ngay/hẹn giờ/nháp (giờ Việt Nam), ghim, bật xác nhận, xoá mềm. Bài cần xác nhận hiện đã xác nhận/đã mở/chưa xác nhận, danh sách người chưa xác nhận và xuất CSV (ghi audit). Hẹn giờ không cần cron: bài hiện ra khi tới giờ ở lần mở trang kế tiếp (chưa có badge realtime cho bài mới).
> - Bài tự sinh: khi BCN chốt challenge tạo bài `result` (số người hoàn thành mỗi hạng mục, top 3); tên người chỉ có khi `club_display_mode = full_opt_in` và người đó bật chia sẻ, nếu không bài chỉ có số lượng. Job tuần (GitHub Actions Chủ nhật 18:00 UTC = 01:00 thứ Hai giờ VN, `GET /api/cron/digest`) tạo một bài "Chúc mừng các thành viên lên level tuần này", cũng chỉ khi `full_opt_in` và chỉ gồm người đã bật chia sẻ. Chống trùng bằng `posts.source_key`. `settings.auto_posts_publish = false` thì bài tự sinh thành bản nháp để BCN sửa rồi đăng ở `/admin/posts`.

### 11 – Event + album
- [~] 11.1 Schema
- [~] 11.2 Màn event
- [~] 11.3 Điểm danh + gắn hoạt động
- [~] 11.4 Upload ảnh R2 ⚠️
- [~] 11.5 Album
- [~] 11.6 Thống kê event

> Ghi chú task 11 (đã chạy typecheck/lint/test/build; **chưa** chạy migration vì máy không có Docker, **chưa** test tay, chưa có bucket R2 thật nên Nghiệm thu chưa tick):
> - Migration `0011_events.sql` (bảng `events`, `event_attendees`, `event_photos`, RLS, view `event_counts`, hàm `set_event_attendance` xử lý hạn đăng ký, hết chỗ → `waitlist`, người huỷ thì người chờ đầu tiên lên `going`; `event_run_summary`, `admin_event_stats`, `admin_event_top_attendees`), `0012_event_checkin.sql` (khoá bí mật theo event trong `event_secrets`, mã điểm danh là HMAC theo khoảng 30 giây tính trong Postgres, `self_check_in` nhận mã của khoảng hiện tại và khoảng liền trước nên link sống 30–60 giây), `0013_event_photo_tags.sql`. `database.generated.ts` sửa tay, cần `npm run db:types` khi có DB.
> - Thành viên đăng ký chỉ qua RPC (không có policy insert trực tiếp) để kiểm hạn/chỗ/hàng chờ trong một transaction. Chưa gửi thông báo khi người chờ được lên `going` (chờ task 14), hàm trả về danh sách người vừa lên để task 14 dùng.
> - Tự gắn hoạt động: `src/lib/events/matchActivity.ts` (khung ±1 giờ, bán kính 3 km từ `start_latlng`, mỗi người lấy buổi dài nhất, bỏ hoạt động riêng tư nếu chủ chưa đồng ý cộng vào số liệu tổng). Event không có toạ độ thì không tự gắn. Job `GET /api/cron/event-activities` (chạy cùng nhịp 15 phút trong workflow Strava cron) và nút "Quét hoạt động" ở `/admin/events/[id]`. Hoạt động khớp mà chưa điểm danh chỉ hiện gợi ý cho BCN, không tự điểm danh.
> - Upload ảnh: `POST /api/uploads` cấp 2 link PUT ký sẵn (ảnh + thumbnail, độ dài file nằm trong chữ ký), `POST /api/uploads/complete` đọc lại object trên R2, kiểm kích thước và chữ ký JPEG (file `.exe` đổi đuôi bị xoá và từ chối) rồi mới ghi `event_photos`. Client nén bằng canvas (2048px/0,82, thumbnail 480px) nên EXIF/GPS không còn; ngày chụp đọc từ EXIF của file gốc. Chưa có HEIC (báo lỗi rõ). `proxy.ts`: request chưa đăng nhập tới `/api/*` (không công khai) trả 401 thay vì chuyển hướng.
> - Cần điền `R2_*` (xem `.env.example`) và cấu hình CORS cho bucket (README, mục Ảnh event) trước khi thử upload. Chưa có việc chuyển ảnh cũ (chờ trả lời câu hỏi cho BCN).
> - Mã QR: người dùng đã đồng ý thêm `qrcode` 1.5.4 (+ `@types/qrcode`). `CheckinPanel` vẽ QR ở trình duyệt từ link điểm danh (`src/lib/events/checkinLink.ts`), tự đổi theo mã 30 giây; vẫn giữ mã chữ và nút chép link. Chưa thử quét bằng camera iPhone thật.
> - `/admin/events/[id]/photos` có thêm `PhotoUploader` để BCN upload ngay tại trang quản lý ảnh.
> - Task 11.2 không nêu màn tạo event cho BCN nên thêm tối thiểu `/admin/events` (danh sách, tạo/sửa, điểm danh tay, phạt vắng dùng loại `event_absent` của 8.1, quản lý ảnh: ẩn, xoá, chọn ảnh bìa) và bật tab Event, mục Event ở `/admin`.

### 12 – Bảng vàng
- [ ] 12.1 Kỷ lục CLB
- [ ] 12.2 Danh hiệu và cột mốc
- [ ] 12.3 Trang bảng vàng

### 13 – Quay số
- [x] 13.1 Schema + thuật toán
- [x] 13.2 Màn quay trực tiếp
- [x] 13.3 Kết quả và trao thưởng

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
| 10 | Ngoài 5 cự ly PR (1K, 5K, 10K, 21K, 42K) có cần 3K, 15K, ultra? | 05 | 5.1 | Không cần thêm cự ly (CoT, 2026-10-24) |
| 11 | PR cho bảng vàng dùng thời gian Strava hay thời gian chip chính thức? | 05 | 12.1 | Dùng thời gian Strava (CoT, 2026-10-24) |

---

## Feedback

Cách ghi: thêm một mục mới ở **trên cùng**, ghi ngày, người góp ý, nội dung. Claude xử lý xong thì ghi "→ Đã xử lý: ..." ngay dưới.

```
### 2026-10-24 – CoT
- Nội dung góp ý...
  → Đã xử lý: sửa plans/07-challenges.md task 7.2 (...)
```

### 2026-10-24 – CoT (lần 3)
- Trang chủ chưa theo mockup; header nền trắng đúng nhưng khi mở dạng PWA phần trên header bị nền xám; làm tiếp step 11.
  → Đã xử lý: làm lại trang chủ theo mockup (lời chào theo giờ, thẻ xanh đậm km tháng/level/pace/hạng CLB/tiến độ challenge, thẻ nợ quỹ, "Tin ghim", "Bảng tin" với thẻ bài bo tròn); header có thêm dòng "Celadon Running Club". Phần xám phía trên khi mở PWA: giả định do `html` không có nền riêng nên vùng status bar lấy màu `body` (xám); đặt `html` nền trắng, `body` giữ nền xám, và `background_color` của manifest thành trắng. Chưa kiểm trên iPhone thật. Còn thiếu so với mockup: chuông thông báo (chờ task 14), top 3 trong thẻ kết quả challenge và số "đã xác nhận 412/598" (bài là markdown, chưa có dữ liệu cấu trúc), thẻ event có ô ngày (chờ liên kết bài với event). Step 11 làm xong phần code, xem ghi chú task 11.

### 2026-10-24 – CoT (lần 2)
- Chuyển trang chậm, không biết web đang chạy; toast nên ở cạnh dưới trên bottom bar; hoạt động có ở /admin/activities nhưng không thấy ở trang cá nhân.
  → Đã xử lý: thanh tiến trình trên cùng khi bấm link nội bộ (`NavigationProgress`), `loading.tsx` skeleton cho `(app)` và `/admin`; toast chuyển xuống cạnh dưới, nằm trên bottom bar. Nguyên nhân hoạt động không hiện: trang `/me` chưa có phần danh sách hoạt động nào (đó là việc của task 5.3), không phải do RLS hay `counts_for_club`/`club_display_mode` (policy `activities_select_own` cho chủ sở hữu thấy tất cả). Thêm khối "Hoạt động gần đây" tối thiểu vào `/me` (20 hoạt động, hiện cả hoạt động bị loại kèm lý do); task 5.3 sẽ mở rộng.

### 2026-10-24 – CoT
- `/admin` ra 404; các action (cập nhật hồ sơ...) bấm xong không có thông báo.
  → Đã xử lý: 404 do chưa có `src/app/admin/page.tsx` (task 3 chỉ có `/admin/activities` và `/admin/sync`; không phải do kiểm tra quyền, `requireBcn` chuyển người không phải BCN về `/`). Thêm trang `/admin` và link "Trang quản trị BCN" ở `/me` cho BCN. Thêm toast dùng chung (`ToastProvider`, `ActionForm`, cookie `clr_flash` cho action có redirect) và gắn vào form hồ sơ, tuỳ chọn chia sẻ, xoá dữ liệu/ngắt kết nối Strava, các action admin.

### 2026-10-23 – CoT
- Chốt plan. Theme xanh lấy từ logo CLB; mockup Trang chủ theme xanh làm chuẩn màu.
  → Đã xử lý: thêm link mockup vào `plans/00-overview.md`, merge PR #1.
- Coding style: viết code dễ đọc, theo single responsibility, ít comment inline.
  → Đã xử lý: ghi vào mục "Coding style" trong `CLAUDE.md`.

### Chỉnh giao diện sau task 11
> - Nền trang trắng (`--color-page`), card tách khối bằng `shadow-sm`. Độ đậm chữ: `font-bold` = 500, `font-black`/`font-extrabold` = 600 (khai báo trong `globals.css`), font chỉ tải 400/500/600.
> - Số theo `vi-VN` (`src/lib/format/number.ts`): ngăn nghìn bằng `.`, thập phân bằng `,` (ví dụ `1.234,5 km`). Cần người dùng xác nhận phần thập phân.
> - Thêm `loading.tsx` cho `challenges`, `challenges/[id]`, `events`, `events/[id]` (loading ở layout chung không chạy khi chuyển giữa các trang con).
> - Bảng xếp hạng challenge bỏ dòng "của tôi" ghim phía trên (bị lặp), vẫn tô nổi dòng của mình trong danh sách.
> - "Ảnh có tôi" chỉ lọc ảnh được gắn tên mình, không tính ảnh mình upload.

### 12 – Bảng vàng
- [x] 12.1 Kỷ lục CLB (tính trong TS từ `race_results` đã xác minh: `src/lib/hallOfFame/records.ts`, nhóm cự ly và giới tính ở `src/config/hallOfFame.ts`; kỷ lục mới khi BCN xác minh thì tạo bài `club-record:<id>`)
- [x] 12.2 Danh hiệu và cột mốc (`0014_honors.sql`: bảng `honors`, hàm `generate_honors` sinh podium, vô địch challenge, mốc km, marathon đầu tiên; `/admin/honors` duyệt, ẩn, xoá và thêm danh hiệu đặc biệt)
- [x] 12.3 Trang `/hall-of-fame` (tab Kỷ lục / Podium / Challenge / Cột mốc, lọc năm) và huy hiệu ở hồ sơ (`/me`, `/members/[id]`)

> Ghi chú task 12 (chưa chạy migration 0014 và 0015, chưa test tay, nên Nghiệm thu chưa tick):
> - Kỷ lục không dùng view SQL mà tính bằng hàm thuần có test; chia nhóm tuổi theo `AGE_GROUPS` (Dưới 30, 30-39, 40-49, Trên 50; tuổi = năm giải − năm sinh) nhờ view `record_member_info` ở `0015_record_member_info.sql`; người chưa khai năm sinh chỉ xuất hiện ở "Mọi lứa tuổi".
> - Danh hiệu tự sinh nằm ở trạng thái chờ duyệt, BCN bấm "Quét danh hiệu mới" ở `/admin/honors` (chưa chạy tự động theo job đêm). Chưa làm mốc "12 tháng liền hoàn thành challenge".
> - `database.generated.ts` thêm tay bảng `honors` và hàm `generate_honors`, cần `npm run db:types` khi có DB.
> - Dữ liệu giả: `supabase/seed_demo.sql` (chạy tay trong SQL Editor, cũng bật `club_display_mode = full_opt_in`), gỡ bằng `supabase/seed_demo_cleanup.sql`.
> - Tải ảnh lên cho ô ảnh bìa (event, bài viết, challenge), giấy chứng nhận và ảnh danh hiệu: `ImageField` + `POST /api/uploads/image`. Ảnh bìa chỉ BCN tải được, giấy chứng nhận thành viên tự tải; file lưu ở `covers/` và `certificates/` với tên ngẫu nhiên.
> - Backfill: `maxDuration` tăng lên 300 giây, workflow thêm `--max-time 300`; dòng báo đồng bộ lịch sử hiện ở thẻ trang chủ kèm lời nhắc có thể mất vài phút.

> Ghi chú task 13 (chưa chạy migration 0016 trên DB thật, chưa test 3 điện thoại, nên Nghiệm thu thủ công chưa tick; test đơn vị cho thuật toán, phân bố 10.000 lần quay và đồng hồ hiệu ứng đã qua):
> - Migration `0016_draws.sql`: `draws`, `draw_secrets` (seed bí mật, không policy nào nên chỉ service role đọc), `draw_prizes`, `draw_participants`, `draw_results` (có `reveal_at`), RLS chỉ cho đọc; mọi thao tác ghi qua server action của BCN bằng service role. `rewards.source_type` thêm giá trị `draw`. Bảng `draws` và `draw_results` thêm vào publication realtime.
> - Thuật toán `src/lib/draw/pick.ts` (PRNG mulberry32, hạt giống là 4 byte đầu của sha256(seed), sắp đầu vào theo memberId nên tái lập được); `seed.ts` dùng chung cho server và trang verify. Mỗi người trúng tối đa một giải (`ONE_PRIZE_PER_MEMBER`), `weight` đã hỗ trợ nhưng chưa có ô sửa trọng số (câu hỏi BCN về nhiều phiếu chưa được trả lời, mặc định 1).
> - Đồng bộ: không dùng Realtime (không chắc phía thành viên nhận được) mà người xem hỏi `GET /api/draws/[id]/state` mỗi 1,5 giây khi đợt quay đang `live`; mỗi lần hỏi cũng ước lượng độ lệch đồng hồ với server (giữ lần có độ trễ khứ hồi thấp nhất). Server ghi kết quả kèm `reveal_at = bây giờ + 8 giây`; client dựng hiệu ứng cuộn tên theo đồng hồ đã bù chênh lệch với server, chạy 5 giây cuối trước `reveal_at` nên mọi máy dừng cùng lúc. Người vào trễ hoặc tải lại thấy các giải đã qua `reveal_at`, giải đang quay thì chạy tiếp hiệu ứng. Người trúng giải đang quay có thể lộ sớm qua payload realtime (chấp nhận).
> - Luồng BCN: `/admin/draws/new` tạo (nguồn challenge hoàn thành, event đã điểm danh hoặc chọn tay) → `/admin/draws/[id]` bỏ/thêm người → Chốt (sinh seed, công bố `seed_commit`) → Bắt đầu → Quay giải tiếp theo → Kết thúc (lộ `seed_reveal`, ghi `rewards`, đăng bài kết quả `draw:<id>`). Huỷ cần lý do, hiện công khai. Thành viên xem ở `/draws`, kiểm tra ở `/draws/[id]/verify`.
> - Chưa có quy tắc loại người đang nợ phạt (câu hỏi BCN); BCN tự bỏ tay ở bước chuẩn bị. Chưa gửi thông báo đẩy khi bắt đầu quay (chờ task 14).

### Chỉnh trang chủ (sau task 13)
> - Trang chủ: 4 ô lối tắt có icon màu (Thành viên, Xếp hạng, Bảng vàng, Quay số) thay cho dòng link gạch chân; mục "Event sắp diễn ra" (tối đa 2, đang diễn ra hoặc gần nhất) ngay dưới bảng tin; mục "Người bạn theo dõi có tin mới" (PR, danh hiệu đã duyệt, kết quả giải trong 30 ngày; PR Strava chỉ khi CLB bật `full_opt_in`).
> - Link quay lại "←" bỏ gạch chân ở mọi trang.
> - Bài kỷ lục CLB: lỗi trước đây bị nuốt im lặng. Giờ toast sau khi xác minh nói rõ kết quả (đã đăng bài, đã có bài, thiếu giới tính, cự ly ngoài nhóm, chưa nhanh hơn kỷ lục); `/admin/honors` có nút "Đăng bài chúc mừng các kỷ lục hiện tại" cho kết quả đã xác minh từ trước khi có tính năng.

### Quay số: hình thức và đồng bộ (sau task 13)
> - Migration `0017_draw_styles.sql`: cột `draws.style` (`reel` cuộn tên 10 giây, `race` thi chạy bộ 15 giây, `duck` đua vịt 15 giây; thời lượng ở `DRAW_STYLE_CONFIG`). Người xem mở được trang quay số ngay khi BCN đã chốt danh sách (hiện "Chờ BCN mở quay số"). RLS `draw_results` chỉ cho đọc từ `reveal_at`.
> - Giữ kín người trúng: `reveal_at = lúc bấm quay + thời lượng hình thức`; `GET /api/draws/[id]/state` (service role) chỉ trả người trúng khi còn 1,5 giây tới `reveal_at` (`WINNER_REVEAL_LEAD_MS`). Trước đó FE chạy hiệu ứng "chưa biết ai thắng": cuộn đều, hoặc cả đoàn trôi về đích và liên tục vượt nhau; khi biết người trúng thì giảm tốc dừng đúng ô giữa, hoặc bứt tốc về đích, đúng lúc `reveal_at`. Hàm thuần và test ở `src/lib/draw/stage.ts`.
> - Hỏi trạng thái thích ứng: 2 giây lúc rảnh, 0,4 giây trong 4 giây cuối trước lúc lộ người trúng (`DRAW_POLL_*` trong config). Chưa dùng Supabase Realtime Broadcast; nếu số người xem đồng thời lớn thì cân nhắc chuyển.
> - Đua chạy bộ/vịt: hiện mọi người tham gia, hình `<symbol>` SVG tự vẽ (người chạy tay chân đung đưa, vịt nhấp nhô) tô màu riêng theo hash, chỉ hiện tên cho nhóm dẫn đầu (hoặc tất cả khi ≤ 8 người). Thêm token màu `water`, `water-deep` ở `globals.css`. Mỗi giải (mỗi suất) một lượt đua riêng. Chưa thử trên điện thoại thật; đã chụp ảnh kiểm tra bằng Chromium ở các mốc tiến độ.

### Bảng tin và quay số: chỉnh lần 2
> - Trang chủ theo thứ tự: thẻ cá nhân (tối đa 3 challenge đang tham gia, mỗi cái 2 dòng: tên · mục tiêu và thanh tiến độ), lối tắt, tin ghim, event đang diễn ra (không có thì sắp tới), rồi bảng tin.
> - Bảng tin gộp một dòng thời gian gồm bài viết, tin của người đang theo dõi (PR, danh hiệu, kết quả giải; không hiện buổi chạy của người khác vì họ xem trên Strava), mới nhất trước, không phân biệt loại. Gộp bằng hàm thuần `mergeFeedSources` (`src/lib/feed/mergeFeed.ts`, có test): nguồn nào còn dữ liệu chưa tải thì mục cũ hơn phần đã tải của nó để sang trang sau. Phân trang bằng nút "Xem thêm" (bỏ tự cuộn tải thêm), con trỏ là thời điểm mục cuối. Mốc thời gian của danh hiệu và kết quả giải là lúc ghi nhận (`created_at`), không phải ngày diễn ra, để tránh trùng mốc khi phân trang. Gỡ `challengeProgress` vì không còn dòng "còn lại".
> - Nút quay lại dùng chung `BackLink` (cùng màu, cùng cỡ chạm). Quy tắc mới trong `CLAUDE.md`: trang mới phải có `loading.tsx` skeleton; thêm skeleton cho `/draws` và `/draws/[id]`.
> - Quay số: bỏ mã commit khỏi trang thành viên (vẫn có link "Tự kiểm tra kết quả"); đang quay thì vẽ "Đang quay giải {tên giải}" trên sân khấu; quay xong hiện màn chúc mừng (giải, tên người trúng, pháo giấy) cho tới khi BCN quay giải mới. Form tạo đợt quay chọn được nhiều challenge hoặc event (danh sách người tham gia là hợp của các nguồn; `draws.source_id` chỉ lưu nguồn đầu tiên, không cần migration).
> - `/me/stats`: khối "Challenge và phạt" trước đây là chỗ giữ chỗ hiển thị "—", giờ lấy dữ liệu thật (số challenge đã tham gia, hoàn thành, số lần bị phạt, còn nợ, kèm danh sách challenge). Tính theo tab tuần/tháng/năm: challenge có thời gian diễn ra giao với kỳ, phạt tính theo ngày tạo. Sửa luôn thứ tự challenge ở trang chủ: `order` trên bảng nhúng không sắp lại dòng cha nên giờ sắp bằng code.
