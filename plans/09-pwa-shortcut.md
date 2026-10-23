# 09 – PWA: cài ra màn hình điện thoại

Mục tiêu: thành viên thêm CLR ra màn hình chính, mở như app thật (toàn màn, có icon, splash), mở nhanh kể cả mạng yếu. Đây cũng là điều kiện để Web Push chạy trên iPhone (14).

Có thể làm bất kỳ lúc nào sau 1.2.

---

## Task 9.1 – Manifest + icon

Làm:
- `src/app/manifest.ts` (Next sinh `manifest.webmanifest`): `name: 'CLR Running Club'`, `short_name: 'CLR'`, `display: 'standalone'`, `start_url: '/?source=pwa'`, `background_color: '#F4F5F7'`, `theme_color: '#1E3A1A'`, `lang: 'vi'`.
- Icon từ logo CLR (`plans/assets/clr-logo.jpg`; với icon nhỏ dùng phần vòng tròn trắng chữ CLR, bỏ viền lá vàng để còn đọc được ở 48px): 192, 512, 512 maskable, `apple-touch-icon` 180. Đặt ở `public/icons/`.
- `shortcuts` trong manifest (nhấn giữ icon trên Android): "Challenge của tôi" → `/challenges`, "Nộp phạt" → `/fund`, "Thống kê" → `/me/stats`.
- Meta `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, màn splash iOS (ảnh theo kích thước iPhone phổ biến, sinh bằng script một lần).

Nghiệm thu:
- [ ] Chrome DevTools → Application → Manifest: không cảnh báo, "Installable".
- [ ] Android: cài được, nhấn giữ icon thấy 3 shortcut.
- [ ] iPhone Safari → Chia sẻ → Thêm vào MH chính: icon đúng, mở toàn màn, thanh trạng thái màu `deep` (xanh đậm).

---

## Task 9.2 – Service worker

Làm:
- Service worker viết tay `public/sw.js` (không thêm thư viện; nếu cần Serwist thì hỏi trước):
  - Cache-first cho asset tĩnh (`/_next/static/*`, font, icon).
  - Network-first có fallback cho trang đã mở (trang chủ, `/me`, challenge đang chạy) để mở lại được khi mất mạng, kèm dải "Đang ngoại tuyến – số liệu lúc 07:42".
  - Trang có dữ liệu cá nhân vẫn được cache (quyết định tạm: PWA cài trên máy cá nhân), nhưng xoá toàn bộ cache trang khi đăng xuất.
- Đăng ký SW trong component client ở layout `(app)`. Phiên bản SW tăng theo build để cập nhật; có thông báo "Có bản mới – Tải lại".

Nghiệm thu:
- [ ] Bật chế độ máy bay sau khi đã mở app → mở lại vẫn thấy trang chủ + dải ngoại tuyến.
- [ ] Deploy bản mới → app đang mở hiện "Có bản mới".
- [ ] Đăng xuất → cache trang bị xoá (DevTools → Cache Storage).

---

## Task 9.3 – Hướng dẫn cài

Làm:
- Android/Chrome: bắt `beforeinstallprompt`, hiện thẻ "Cài CLR ra màn hình chính" trên trang chủ, bấm là cài.
- iPhone: không có prompt tự động → nhận diện Safari iOS chưa ở chế độ standalone, hiện thẻ hướng dẫn 2 bước có hình (nút Chia sẻ → "Thêm vào MH chính").
- Thẻ tắt được, ghi nhớ bằng `localStorage` 30 ngày. Không hiện khi đã chạy standalone.

Nghiệm thu:
- [ ] Android: thẻ hiện, bấm cài thành công, sau đó thẻ không hiện nữa.
- [ ] iPhone Safari: thấy hướng dẫn; mở từ icon đã cài: không thấy.
- [ ] Mở trong trình duyệt của Zalo/Facebook (không cài được): thẻ hướng dẫn "Mở bằng Safari/Chrome" + nút sao chép link.
