# CLR

Webapp (PWA) cho CLB chạy bộ CLR: đăng nhập bằng Strava, thống kê, challenge, thưởng phạt, event, quỹ. Kế hoạch và tiến độ nằm trong `plans/`.

## Chạy local

Yêu cầu: Node 24 (`nvm use`), Docker (cho Supabase local).

```bash
npm ci
cp .env.example .env.local
npx supabase start          # in ra URL và key local, điền vào .env.local
npx supabase db reset       # chạy migration + seed
npm run dev                 # http://localhost:3000
```

Trang kiểm tra (chỉ có khi chạy dev): `/dev/theme` (bảng màu), `/dev/db` (đọc bảng `settings`).

Kiểm tra trước khi commit: `npm run typecheck && npm run lint && npm test`.

Sinh lại kiểu DB sau khi đổi schema: `npm run db:types` (ghi `src/lib/types/database.generated.ts`, không sửa tay). Code import `Database` từ `@/lib/types/database`, file này thu hẹp các cột text có check constraint thành union; thêm giá trị vào constraint thì sửa union ở đó.

## Đưa migration lên production

Tự động: khi merge vào `main` có file mới trong `supabase/migrations/`, workflow `Migrate production` chạy `supabase db push` lên project production. Cần 3 secret trong GitHub (Settings → Secrets and variables → Actions): `SUPABASE_ACCESS_TOKEN` (tạo ở supabase.com/dashboard/account/tokens), `SUPABASE_DB_PASSWORD` (mật khẩu database của project production), `SUPABASE_PROJECT_REF` (project ref của `clr`). Có thể chạy lại tay ở tab Actions.

Preview (`clr-preview`) vẫn chạy tay:

```bash
npx supabase login
npx supabase link --project-ref <project-ref-preview>
npx supabase db push
```

Migration chỉ thêm file mới (`supabase/migrations/000N_*.sql`), không sửa file đã chạy.

## Triển khai

Vercel: preview cho mỗi PR, production từ `main`. Biến môi trường khai báo theo `.env.example` (URL công khai là `APP_URL`, không có tiền tố `NEXT_PUBLIC_`), tách Preview và Production (Preview dùng project Supabase riêng).

## Đồng bộ Strava

1. Điền `STRAVA_WEBHOOK_VERIFY_TOKEN` và `CRON_SECRET` trên Vercel (Production và Preview), thêm secret `APP_URL` và `CRON_SECRET` vào GitHub Actions để workflow `Strava cron` gọi `/api/cron/*`.
2. Sau khi deploy, đăng ký webhook một lần: `npm run strava:subscribe -- create` (đọc `.env.local`; Strava gọi `GET /api/strava/webhook` để xác thực). `list` xem subscription, `delete <id>` xoá. Mỗi app Strava chỉ có một subscription.
