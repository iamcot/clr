# 00 – Tổng quan: Webapp CLB chạy bộ CLR

## Cách dùng bộ plan này (dành cho người dùng)

- **Mỗi phiên Claude Code chỉ giao một task** (ví dụ "làm task 7.3"). Prompt mẫu:
  > Đọc CLAUDE.md, plans/00-overview.md và plans/07-challenges.md. Làm task 7.3. Xong thì báo cáo theo mẫu trong CLAUDE.md.
- Sau mỗi task, **tự test tay theo phần Nghiệm thu** của task đó (trên điện thoại thật nếu task có giao diện) rồi mới giao task tiếp.
- Có góp ý, đổi ý, phát hiện lỗi: ghi vào mục **Feedback** cuối `plans/PROGRESS.md`. Phiên sau Claude đọc file đó trước khi làm.
- Task đánh dấu ⚠️ là task khó (bảo mật, tiền, đồng bộ dữ liệu). Nên dùng model mạnh nhất cho các task này.
- Mục **Quyết định tạm** trong từng file là chỗ Claude đã tự chọn để không bị kẹt. Muốn đổi thì sửa thẳng trong file hoặc ghi vào Feedback.
- Mục **Câu hỏi cho BCN** là những thứ cần CLB trả lời trước khi làm task liên quan.

## Mục tiêu

Một app duy nhất để thành viên CLR: đăng nhập bằng Strava, thấy số liệu chạy của mình và vị trí trong CLB, tham gia challenge, biết mình bị phạt bao nhiêu và nộp ở đâu, xem tin và ảnh event. BCN có trang `/admin` để quản lý thành viên, challenge, thưởng phạt, event, quỹ.

Nguyên tắc: **tự động trước, nhập tay sau**. Cái gì lấy được từ Strava thì không bắt thành viên nhập. Cái gì BCN đang làm bằng Excel/Zalo thì app phải nhanh hơn, không chậm hơn.

## Giao diện

Mockup:
- Trang chủ theo theme xanh (bản chốt màu): https://claude.ai/artifact/633iLUgEPjKHpd5Y4H4RwY
- Bộ 6 màn điện thoại + trang admin (màu cũ navy/cam, chỉ tham khảo bố cục): https://claude.ai/artifact/8ihK8LyVtwaMyoMBYoT9VR

Mockup là tham khảo bố cục, không phải bản vẽ chính xác từng pixel. Màu luôn theo bảng dưới.

- Theme lấy từ logo CLB (`plans/assets/clr-logo.jpg`), **màu chủ đạo xanh lá**. Mockup giữ bố cục, chỉ thay màu theo bảng dưới (không vẽ lại mockup).
- Font **Be Vietnam Pro**.

| Token | Mã | Lấy từ logo | Dùng cho |
|---|---|---|---|
| `brand` | `#45802E` | chữ C (xanh đậm) | Màu chủ đạo: nút chính (chữ trắng), tab đang chọn, link, icon nhấn. Tương phản trên trắng 4,8:1 |
| `brand-dark` | `#2F6B22` | | Hover/nhấn của nút chính, chữ nhấn cỡ nhỏ trên nền sáng (6,5:1) |
| `deep` | `#1E3A1A` | (đậm hơn chữ C) | Khối nền đậm thay cho navy cũ: header trang Tôi, thẻ tổng quan, thanh trạng thái PWA. Chữ trắng 12,5:1 |
| `lime` | `#8BC83C` | chữ L (xanh nõn) | Thanh tiến độ, biểu đồ, điểm nhấn trên nền `deep` (6,2:1). **Không** dùng làm màu chữ trên nền trắng (2:1) |
| `gold` | `#DBC426` | chữ R (vàng) | Bảng vàng, thưởng, top 3, huy hiệu, quay số. Chữ trên nền gold dùng `deep` (7,1:1) |
| `page` | `#F4F5F7` | | Nền app (giữ như mockup) |
| `ink` | `#1A1F1A` | chữ đen trong logo | Chữ chính |
| `muted` | `#5F6B5F` | | Chữ phụ |
| `line` | `#E2E6E0` | | Viền, đường kẻ |
| `danger` | `#C2410C` | | Phạt, tiền nợ, lỗi (giữ màu cam cũ của mockup) |
| `success` | `brand` | | Hoàn thành, đã nộp |

Quy tắc: xanh là màu của hành động và tiến độ, vàng chỉ dành cho thành tích/thưởng (dùng tiết chế để vàng còn "quý"), cam chỉ dành cho tiền nợ và lỗi.
- Tab bar dưới 5 mục: **Trang chủ / Challenge / Event / Quỹ / Tôi**. Tab nào chưa có tính năng (theo giai đoạn) thì ẩn.
- Mobile-first, chạm tối thiểu 44px, hoạt động tốt ở màn 360px.

## Stack (chỉ dùng những thư viện này)

| Việc | Thư viện / dịch vụ |
|---|---|
| Ngôn ngữ / runtime | TypeScript 5, Node 24 (`.nvmrc`) |
| Web | Next.js 16 (App Router), React 19 |
| CSS | Tailwind CSS v4 (không thư viện UI) |
| DB, auth session, realtime, cron | Supabase: Postgres + RLS, `@supabase/ssr`, `@supabase/supabase-js`, Realtime, `pg_cron` |
| Hosting | Vercel (Route Handler cho webhook, Cron cho job nhẹ) |
| Lưu ảnh | Cloudflare R2 (API tương thích S3) qua `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |
| Dữ liệu chạy | Strava API v3 (OAuth tự viết, webhook) |
| Web Push (V2) | `web-push` |
| Mã QR điểm danh (11.3) | `qrcode` (+ `@types/qrcode`), vẽ ở trình duyệt |
| Test | `vitest` |
| Lint | `eslint` + `eslint-config-next` |

Ghi version cứng trong `package.json` (không dùng `^`), lấy bản ổn định mới nhất lúc làm task 1.1 và ghi lại vào `PROGRESS.md`.

## Cấu trúc repo

```
clr/
├── CLAUDE.md
├── plans/                      # plan + PROGRESS.md
├── supabase/
│   ├── migrations/             # 0001_init.sql, 0002_... (chỉ thêm, không sửa file cũ)
│   └── seed.sql                # dữ liệu mẫu cho dev
├── public/                     # icon PWA, manifest
└── src/
    ├── app/
    │   ├── (app)/              # khu thành viên, có tab bar
    │   │   ├── page.tsx        # Trang chủ
    │   │   ├── challenges/
    │   │   ├── events/
    │   │   ├── fund/
    │   │   └── me/
    │   ├── admin/              # khu BCN, layout riêng, kiểm quyền
    │   ├── login/
    │   └── api/
    │       ├── auth/strava/    # OAuth start + callback
    │       ├── strava/webhook/ # nhận event Strava
    │       └── cron/           # job do Vercel Cron gọi
    ├── components/             # component dùng chung
    ├── config/                 # thông số nghiệp vụ (levels.ts, penalties.ts, strava.ts...)
    └── lib/
        ├── supabase/           # client server/browser/service
        ├── strava/             # gọi API, map dữ liệu, rate limit
        ├── stats/              # hàm thuần: pace, level, tổng hợp
        ├── challenges/         # hàm thuần: tính điểm, xếp hạng
        └── types/              # kiểu dùng chung
```

## Vai trò

| Vai trò | Ai | Quyền |
|---|---|---|
| `guest` | Đã đăng nhập Strava, chưa được duyệt | Xem hồ sơ của mình, trang chờ duyệt |
| `member` | Thành viên đã duyệt (chính thức hoặc tự do) | Mọi tính năng thành viên |
| `bcn` | Ban chủ nhiệm | `/admin` toàn bộ trừ phần tiền nếu không kiêm thủ quỹ |
| `treasurer` | Thủ quỹ (cũng là BCN) | Thêm quyền sửa thu chi, xác nhận nộp phạt |

Loại thành viên (`member_type`): `official` (chính thức) và `free` (tự do). Loại ảnh hưởng tới challenge bắt buộc và mức phạt (xem `04-members.md`).

## Mô hình dữ liệu chính

Chi tiết cột nằm trong từng file plan. Bức tranh chung:

```
members ─┬─ strava_tokens (1-1, chỉ service role đọc)
         ├─ activities ──── activity_best_efforts
         ├─ member_stats_period (tổng hợp theo tuần/tháng/năm)
         ├─ race_results (thành tích giải)
         ├─ follows (member ↔ member)
         ├─ challenge_entries ── challenges
         ├─ penalties / rewards ── (nguồn: challenge, event, BCN nhập)
         ├─ event_attendees ── events ── event_photos
         └─ posts / comments / reactions
fund_transactions (thu chi) ── bank_webhook_events (V3)
settings (key-value cấu hình CLB: link Zalo, quy chế, mức phạt mặc định...)
audit_logs (mọi thao tác BCN đổi dữ liệu người khác)
```

## Giai đoạn

| File | Nội dung | Giai đoạn |
|---|---|---|
| `01-setup.md` | Khung dự án, Supabase, Vercel, design token, CI | MVP |
| `02-auth-strava.md` ⚠️ | Đăng nhập Strava, tạo session Supabase, phân quyền | MVP |
| `03-strava-sync.md` ⚠️ | Webhook, kéo lịch sử, refresh token, rate limit | MVP |
| `04-members.md` | Duyệt thành viên, chính thức/tự do, theo dõi nhau, khung `/admin` | MVP |
| `05-profile-pr.md` | Hồ sơ, PR tự động, thành tích các giải | MVP |
| `06-stats-level.md` | Thống kê cá nhân, level, xếp hạng trong CLB | MVP |
| `07-challenges.md` ⚠️ | Tạo challenge, đăng ký, tính kết quả, bảng xếp hạng | MVP |
| `08-rewards-penalties.md` | Thưởng phạt cơ bản (ghi nhận, BCN xác nhận đã nộp) | MVP |
| `09-pwa-shortcut.md` | Cài lên màn hình điện thoại, offline cơ bản | MVP |
| `10-news-feed.md` | Bảng tin CLB, ghim, bình luận, thả tim | V2 |
| `11-events-album.md` | Event, đăng ký, điểm danh, thống kê, album ảnh R2 | V2 |
| `12-hall-of-fame.md` | Bảng vàng thành tích | V2 |
| `13-lucky-draw.md` | Quay số challenge online | V2 |
| `14-push-notifications.md` | Thông báo đẩy (Web Push) | V2 |
| `15-links-support.md` | Liên kết Zalo/fanpage/Strava/quy chế, liên hệ BCN | V2 |
| `16-fund-vietqr.md` ⚠️ | Quỹ CLB, nộp phạt bằng VietQR, tự đối soát (SePay/Casso) | V3 |
| `17-finance-report.md` | Báo cáo thu chi, công khai quỹ | V3 |

Thứ tự trong MVP: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09. Có thể làm 09 sớm hơn vì độc lập.

## Rủi ro lớn cần xử lý sớm

1. **Strava giới hạn app mới.** App Strava mới tạo chỉ cho **1 người** kết nối và rate limit thấp cho tới khi Strava duyệt. Phải gửi đơn duyệt (form "Developer Program") ngay khi có bản MVP chạy được cho vài người, và chuẩn bị ảnh chụp màn hình có logo "Powered by Strava" / nút "Connect with Strava" đúng brand guideline. Duyệt có thể mất vài tuần.
2. **Điều khoản API Strava về hiển thị dữ liệu.** Từ cuối 2024 Strava siết điều khoản: dữ liệu hoạt động của một người chỉ nên hiện cho chính người đó, trừ một số trường hợp. Bảng xếp hạng CLB hiện tên + km của người khác có thể bị coi là vi phạm. Task 3.0 phải đọc lại bản API Agreement hiện hành và chọn cách làm (xem `03-strava-sync.md`). Không xong task 3.0 thì không làm 06 và 07.
3. **600 người kết nối cùng lúc khi ra mắt** sẽ vượt rate limit nếu kéo lịch sử ngay. Kéo lịch sử phải đi qua hàng đợi có giới hạn (task 3.4).

## Định nghĩa "xong" MVP

Một thành viên mới bấm "Kết nối với Strava" trên điện thoại, được BCN duyệt, cài app ra màn hình chính. Chạy xong một buổi, trong vài phút app hiện buổi chạy, tổng km tháng, pace, level và vị trí trong challenge tháng. Cuối tháng challenge tự chốt, người không đạt tự có khoản phạt, BCN đánh dấu đã nộp trong `/admin`.
