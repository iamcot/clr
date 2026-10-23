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

Sinh lại kiểu DB sau khi đổi schema: `npm run db:types`.

## Đưa migration lên production

Chạy tay sau khi merge vào `main`:

```bash
npx supabase login
npx supabase link --project-ref <project-ref-production>
npx supabase db push
```

Migration chỉ thêm file mới (`supabase/migrations/000N_*.sql`), không sửa file đã chạy.

## Triển khai

Vercel: preview cho mỗi PR, production từ `main`. Biến môi trường khai báo theo `.env.example` (URL công khai là `APP_URL`, không có tiền tố `NEXT_PUBLIC_`), tách Preview và Production (Preview dùng project Supabase riêng).
