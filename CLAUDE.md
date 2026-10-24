# CLAUDE.md – Luật làm việc cho dự án CLR

File này đặt ở gốc repo. Claude Code đọc nó mỗi phiên. **Tuân thủ tuyệt đối.**

CLR là webapp (PWA, ưu tiên điện thoại) cho CLB chạy bộ CLR, khoảng 600 thành viên: đăng nhập bằng Strava, tự đồng bộ hoạt động, thống kê, challenge, thưởng phạt, event, quỹ CLB. Trang `/admin` dành cho Ban chủ nhiệm (BCN).

## Trước khi code
1. Đọc `plans/00-overview.md` và file plan của task đang được giao (ví dụ `plans/07-challenges.md`).
2. Đọc `plans/PROGRESS.md` để biết task nào đã xong và feedback mới nhất của người dùng.
3. Nếu yêu cầu mơ hồ hoặc mâu thuẫn với plan: **dừng lại và hỏi**, không tự đoán.
4. Next.js bản đang dùng có thay đổi lớn so với dữ liệu huấn luyện: đọc hướng dẫn trong `node_modules/next/dist/docs/` trước khi viết code đụng tới routing, cache, server action.

## Phạm vi
- Chỉ làm **đúng task được giao**. Không làm trước task sau, không "tiện tay" refactor chỗ khác.
- Không viết lại cả file khi chỉ cần sửa vài dòng.
- Không đổi schema DB đã có migration chạy rồi bằng cách sửa file migration cũ. Luôn thêm migration mới.
- Không đổi kiểu dữ liệu dùng chung trong `src/lib/types/` nếu task không yêu cầu. Thấy cần đổi: dừng, giải thích lý do, chờ đồng ý.
- Không thêm thư viện ngoài danh sách trong `plans/00-overview.md`. Cần thêm thì hỏi trước.

## Coding style (yêu cầu của CoT)
- **Code dễ đọc.** Tên biến, hàm nói rõ nó là gì, làm gì. Hàm ngắn, ít lồng nhau, return sớm thay vì if/else sâu.
- **Single responsibility.** Mỗi hàm làm một việc, mỗi file/module lo một mảng. Component không vừa gọi DB vừa tính toán vừa hiển thị: tách phần lấy dữ liệu, phần logic thuần, phần giao diện.
- **Ít comment inline.** Để tên hàm và cấu trúc code tự giải thích. Chỉ comment khi lý do không thể đọc ra từ code (luật nghiệp vụ lạ, giới hạn của Strava/ngân hàng, workaround).

## Quy ước kỹ thuật của dự án
- TypeScript strict (`"strict": true`, `"noUncheckedIndexedAccess": true`). Không dùng `any`; cần thoát thì `unknown` + thu hẹp kiểu.
- **Không dấu chấm phẩy**, nháy đơn `'...'`, thụt 2 dấu cách, dòng tối đa ~120 ký tự. Trailing comma ở object/mảng nhiều dòng.
- `import type { ... }` cho import chỉ có kiểu. Import nội bộ dùng alias `@/` (trỏ `src/`).
- Đặt tên: component `PascalCase.tsx` (một component chính `export default function`, component phụ nhỏ để cùng file); hàm/biến `camelCase`; hằng số `UPPER_SNAKE`; bảng/cột DB `snake_case`; route URL tiếng Anh viết thường có gạch (`/challenges/[id]`).
- Next.js App Router. Server Component mặc định, chỉ thêm `'use client'` khi cần tương tác. Đọc dữ liệu ở server, ghi qua Server Action hoặc Route Handler.
- Tailwind CSS v4, không dùng thư viện UI. Màu lấy từ token trong `globals.css` (`page`, `brand`, `brand-dark`, `deep`, `lime`, `gold`, `ink`, `muted`, `line`, `danger`; bảng màu ở `plans/00-overview.md`), không viết mã màu thẳng trong component.
- **Trang mới phải có skeleton**: mỗi route mới (nhất là trang chi tiết có tải dữ liệu) thêm `loading.tsx` dùng `ListSkeleton` hoặc `DetailSkeleton` trong `components/PageSkeleton.tsx`, để mở trang không bị trắng.
- Nút quay lại dùng `components/BackLink.tsx`, không tự viết `<Link>` với `←` để các trang đồng một style.
- Gọi HTTP bằng `fetch` gốc, không axios. Supabase qua `@supabase/ssr` + `@supabase/supabase-js`.
- Không có thư viện state toàn cục. Context + `useState` là đủ.
- **Mọi thông số nghiệp vụ** (ngưỡng level, mức phạt mặc định, pace tối đa hợp lệ, giới hạn rate Strava...) nằm trong `src/config/*.ts` hoặc bảng `settings`, **không hardcode** trong logic.
- Logic tính toán thuần (pace, level, điểm challenge, đối soát chuyển khoản) đặt trong `src/lib/**` dạng hàm thuần, không import Supabase hay DOM, và **phải có test vitest** đặt cạnh file (`*.test.ts`).
- Chuỗi giao diện, tài liệu (và comment khi thật cần) viết **tiếng Việt có dấu**. Tên biến, hàm, bảng viết tiếng Anh.
- Thời gian lưu UTC (`timestamptz`), hiển thị theo `Asia/Ho_Chi_Minh`. Khoảng cách lưu mét (số nguyên), thời gian lưu giây, pace hiển thị `m:ss/km`.
- Tiền lưu VND số nguyên (`bigint`), không dùng số thực.
- Secret (Strava client secret, refresh token, service role key, webhook key) chỉ ở server, không bao giờ có tiền tố `NEXT_PUBLIC_`.
- Commit message ngắn, viết thường, tiếng Anh, thì hiện tại (ví dụ `add strava webhook`).

## Bảo mật dữ liệu
- Mọi bảng bật **RLS**. Policy viết trong migration cùng lúc tạo bảng. Client chỉ dùng anon key; service role chỉ dùng trong Route Handler / job server.
- Quyền BCN kiểm ở **cả** policy DB lẫn layout `/admin` (không chỉ ẩn nút).
- Hoạt động Strava riêng tư (`private`) của thành viên không hiện cho người khác, kể cả BCN. Chỉ được cộng vào số liệu tổng nếu thành viên đã đồng ý (xem `plans/03-strava-sync.md`).

## Khi sửa bug
1. Mô tả **nguyên nhân giả định** và **cách xác minh** (log, query, test) trước khi sửa.
2. Xác minh rồi mới sửa. Sửa **một nguyên nhân mỗi lần**.
3. Nếu sửa 2 lần chưa xong: dừng, tóm tắt những gì đã thử, đề xuất hướng khác. Không sửa vòng vòng.

## Sau mỗi task
1. Chạy `npm run typecheck`, `npm run lint` và `npm test`, phải pass.
2. Cập nhật `plans/PROGRESS.md` (đánh dấu task, ghi chú ngắn: quyết định quan trọng, chỗ chưa làm).
3. Báo cáo theo mẫu:
   - **Đã làm:** ...
   - **File thay đổi:** ...
   - **Migration mới:** ... (nếu có)
   - **Cách test tay:** các bước cụ thể để người dùng tự kiểm tra trên điện thoại
   - **Chưa chắc / cần người dùng quyết:** ...
