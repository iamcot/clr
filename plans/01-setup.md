# 01 – Khung dự án

Mục tiêu: repo chạy được trên máy và trên Vercel, có Supabase, có design token theo mockup, có CI chạy typecheck/lint/test.

---

## Task 1.1 – Khởi tạo Next.js

Làm:
- `create-next-app` với TypeScript, App Router, Tailwind v4, ESLint, thư mục `src/`, alias `@/*`.
- Ghi version cứng (bỏ `^`) cho mọi package. `.nvmrc` = Node 24.
- `tsconfig.json`: thêm `"noUncheckedIndexedAccess": true`.
- Prettier **không** dùng; định dạng theo quy ước trong CLAUDE.md, ESLint thêm rule `semi: ['error', 'never']`, `quotes: ['error', 'single', { avoidEscape: true }]`.
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- `vitest.config.mts` với alias `@/`.
- Một test giả trong `src/lib/stats/pace.test.ts` để xác nhận vitest chạy.

Nghiệm thu:
- [ ] `npm run dev` mở trang có chữ "CLR" ở `localhost:3000`.
- [ ] `npm run typecheck`, `npm run lint`, `npm test` đều pass.
- [ ] Viết thử một dòng có dấu chấm phẩy thì `npm run lint` báo lỗi.

---

## Task 1.2 – Design token + layout khung

Làm:
- `src/app/globals.css`: khai báo token Tailwind v4 bằng `@theme`:
  - Đủ các token trong bảng màu ở `00-overview.md` (mục Giao diện): `--color-brand`, `--color-brand-dark`, `--color-deep`, `--color-lime`, `--color-gold`, `--color-page`, `--color-ink`, `--color-muted`, `--color-line`, `--color-danger`, `--color-success`.
  - Logo: `public/brand/` (bản gốc ở `plans/assets/clr-logo.jpg`; dùng bản vector khi BCN gửi).
  - Font Be Vietnam Pro qua `next/font/google` (subset `vietnamese`, `latin`; weight 400/500/700/900).
- `src/app/(app)/layout.tsx`: khung mobile (max-width ~480px giữa màn trên desktop), header gọn, **tab bar dưới** `components/AppTabs.tsx` với 5 tab từ `src/config/nav.ts` (mỗi tab có cờ `enabled` để ẩn tab chưa làm).
- Trang chủ tạm, trang `/me` tạm.

Nghiệm thu:
- [ ] Trên điện thoại (hoặc DevTools 360px): tab bar dính đáy, không che nội dung, tôn trọng `safe-area-inset-bottom` trên iPhone.
- [ ] Tab đang mở được tô màu `brand`.
- [ ] Trang mẫu `/dev/theme` (chỉ có ở môi trường dev) hiện đủ các token màu, nút chính, thanh tiến độ, huy hiệu vàng để so với logo.
- [ ] Đổi `enabled: false` cho tab Quỹ trong config thì tab biến mất.

---

## Task 1.3 – Supabase

Làm:
- Tạo project Supabase (region Singapore). Cài Supabase CLI làm dev dependency, `supabase init`, dùng `supabase start` để có DB local.
- `src/lib/supabase/server.ts` (dùng `@supabase/ssr` + cookies), `browser.ts`, `service.ts` (service role, chỉ import được ở server: thêm `import 'server-only'`).
- Migration `0001_init.sql`: extension `pgcrypto`, `pg_cron`; bảng `settings (key text pk, value jsonb, updated_at)`; bảng `audit_logs (id, actor_id, action, target_table, target_id, before jsonb, after jsonb, created_at)`; hàm `set_updated_at()` trigger dùng chung.
- Script `npm run db:types` sinh `src/lib/types/database.ts` từ schema.
- `.env.example` liệt kê đủ biến (không có giá trị thật).

Nghiệm thu:
- [ ] `supabase start` + `supabase db reset` chạy migration không lỗi.
- [ ] Trang tạm đọc được 1 dòng từ `settings` (seed) bằng server client.
- [ ] Import `service.ts` trong một client component thì build báo lỗi.

Pitfall:
- Supabase đã chuyển sang khoá mới (`publishable` / `secret` thay cho `anon` / `service_role`) ở project mới. Đọc docs hiện hành khi lấy key, đặt tên biến theo key thực tế.

---

## Task 1.4 – Vercel + CI

Làm:
- Kết nối repo với Vercel. Preview deploy cho mỗi PR, production từ `main`.
- Biến môi trường trên Vercel tách Preview / Production. Preview dùng project Supabase riêng (hoặc branch DB) để không đụng dữ liệu thật.
- `.github/workflows/ci.yml`: Node theo `.nvmrc`, `npm ci`, `typecheck`, `lint`, `test`.
- Migration lên production: chạy tay `supabase db push` sau khi merge (ghi hướng dẫn vào `README.md`). Không tự động ở giai đoạn đầu.

Nghiệm thu:
- [ ] Mở PR thử: CI chạy và xanh, Vercel có link preview.
- [ ] `README.md` có mục "Chạy local" và "Đưa migration lên production".

---

## Câu hỏi cho BCN
- Tên miền dùng là gì (ví dụ `clr.run`, `app.clr.vn`)? Ai đứng tên tài khoản Vercel, Supabase, Cloudflare, Strava app (nên là email chung của CLB, không phải cá nhân)?
- Có logo CLR dạng vector (SVG/AI) không? Hiện chỉ có ảnh JPG 828px (đủ làm icon tạm, cần vector để nét khi in và làm icon maskable).
