# 03 – Đồng bộ hoạt động Strava ⚠️

Mục tiêu: mọi hoạt động của thành viên tự về app trong vài phút sau khi lưu trên Strava (tạo, sửa, xoá). Lịch sử cũ được kéo về dần mà không vượt rate limit.

Thứ tự: 3.0 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6.

---

## Giới hạn Strava cần nhớ (kiểm lại docs lúc làm, số có thể đổi)

- Rate limit mặc định theo app: khoảng **200 request / 15 phút, 2.000 / ngày** tổng, riêng request đọc khoảng **100 / 15 phút, 1.000 / ngày**. Strava trả header `X-RateLimit-Limit`, `X-RateLimit-Usage` (và `X-ReadRateLimit-*`): **luôn đọc header**, không tự đếm đoán.
- App chưa duyệt: chỉ **1 athlete** kết nối được. Xin duyệt để nâng giới hạn người dùng và rate limit.
- Webhook: mỗi app **một subscription**. Event chỉ có `object_id`, `owner_id`, `aspect_type` (`create`/`update`/`delete`), `updates`, `event_time`. Phải trả 200 trong **2 giây**, xử lý sau.
- `best_efforts` (PR 400m, 1K, 5K, 10K, HM, FM...) chỉ có ở **chi tiết** hoạt động (`GET /activities/{id}`), không có ở danh sách.
- Access token hết hạn sau ~6 giờ, làm mới bằng refresh token. Refresh token có thể đổi sau mỗi lần làm mới: luôn lưu cái mới.

Với 600 người, trung bình ~250–400 hoạt động/ngày → mỗi hoạt động 1 request chi tiết là vừa giới hạn ngày. Kéo lịch sử phải chạy rải rác nhiều ngày.

---

## Task 3.0 – Đọc điều khoản và chốt cách hiển thị ⚠️

Không code. Đọc bản hiện hành của Strava API Agreement + Brand Guidelines, trả lời và ghi vào `PROGRESS.md`:
- App CLB có được hiện **tên + số km/pace** của thành viên A cho thành viên B (bảng xếp hạng challenge, xếp hạng level) không? Điều kiện gì (ví dụ cả hai đều đã kết nối app, A đồng ý)?
- Có được hiện bản đồ (polyline) của A cho B không?
- Phải xoá dữ liệu trong bao lâu khi người dùng thu hồi quyền?
- Logo/attribution bắt buộc ở đâu.

Quyết định tạm (áp dụng nếu điều khoản cho phép hiển thị khi có đồng ý):
- Lần kết nối đầu, thành viên tick đồng ý "Cho phép thành viên CLR khác xem tổng km, pace và thứ hạng của tôi". Không tick thì vẫn dùng app, vẫn bị tính challenge, nhưng ở bảng xếp hạng người khác chỉ thấy tên, không thấy số liệu chi tiết. Cột `members.share_stats_with_club bool`.
- **Không** hiện bản đồ hoạt động của người khác. Bản đồ chỉ hiện cho chính chủ.

Nếu điều khoản cấm hẳn: dừng, báo người dùng, đề xuất phương án khác (ví dụ chỉ hiện thứ hạng không kèm số, hoặc dùng bảng xếp hạng club có sẵn của Strava).

Nghiệm thu:
- [ ] `PROGRESS.md` có đoạn tóm tắt điều khoản (kèm link + ngày đọc) và cách làm đã chốt.

---

## Task 3.1 – Bảng activities

Làm (migration mới):
- `activities`:
  - `id bigint pk` (= Strava activity id), `member_id uuid fk`, `name text`
  - `sport_type text` (Run, TrailRun, VirtualRun, Walk, Ride...), `start_date timestamptz`, `start_date_local timestamp`, `timezone text`
  - `distance_m int`, `moving_time_s int`, `elapsed_time_s int`, `elevation_gain_m numeric(7,1)`
  - `average_heartrate numeric(5,1)`, `max_heartrate numeric(5,1)`, `average_cadence numeric(5,1)`
  - `manual bool`, `trainer bool`, `visibility text` (`everyone`/`followers_only`/`only_me`), `private bool`
  - `summary_polyline text`, `start_latlng point`
  - `flagged_invalid bool default false`, `invalid_reason text` (BCN hoặc luật chống gian lận đánh dấu)
  - `detail_fetched bool default false`, `raw jsonb` (bản gốc Strava, để tính lại khi đổi luật)
  - `created_at`, `updated_at`
  - index `(member_id, start_date desc)`, `(start_date)`
- `activity_best_efforts`: `activity_id fk on delete cascade`, `name text` (`400m`, `1K`, `5K`...), `distance_m int`, `elapsed_time_s int`, `pr_rank int null`, pk `(activity_id, name)`.
- RLS `activities`: chính chủ đọc tất cả của mình; người khác chỉ đọc qua view `activities_club` (không có `summary_polyline`, `start_latlng`, `raw`; loại `private`/`only_me`; chỉ của người `share_stats_with_club = true`). BCN đọc view đó + được `update` cột `flagged_invalid`, `invalid_reason`.
- `src/lib/strava/mapActivity.ts`: map JSON Strava → dòng `activities` (hàm thuần + test với JSON mẫu trong `src/lib/strava/__fixtures__/`).

Nghiệm thu:
- [ ] Test map đúng các trường với 3 fixture: chạy ngoài trời, chạy máy (trainer), nhập tay (manual).
- [ ] User B đọc `activities` của A trực tiếp: rỗng. Đọc `activities_club`: có, không thấy polyline.

---

## Task 3.2 – Client Strava + quản lý token + rate limit ⚠️

Làm:
- `src/lib/strava/client.ts`: `getActivity(memberId, id)`, `listActivities(memberId, { after, before, page, perPage })`, `getAthlete(memberId)`.
  - Trước mỗi request lấy token qua `getValidToken(memberId)`: còn > 5 phút thì dùng, không thì refresh và lưu (khoá dòng bằng `select ... for update` hoặc advisory lock để hai job không cùng refresh).
  - 401 → refresh một lần rồi thử lại. Refresh trả lỗi `invalid_grant` → đánh dấu `strava_connected = false`.
  - Đọc header rate limit, ghi vào bảng `strava_rate_state (window text pk, limit int, usage int, updated_at)`.
  - 429 → không thử lại ngay; ném lỗi `RateLimited` kèm thời điểm cửa sổ 15 phút kế tiếp.
- `src/config/strava.ts`: ngưỡng an toàn (ví dụ dừng job nền khi đã dùng 80% hạn mức 15 phút hoặc 90% hạn mức ngày, chừa phần cho webhook).

Nghiệm thu:
- [ ] Test (fetch giả): token hết hạn → gọi refresh đúng một lần, lưu refresh token mới.
- [ ] Test: header usage vượt ngưỡng → `canSpend('background')` trả false nhưng `canSpend('webhook')` vẫn true.

---

## Task 3.3 – Webhook ⚠️

Làm:
- `src/app/api/strava/webhook/route.ts`:
  - `GET`: xác thực subscription (`hub.mode=subscribe`, so `hub.verify_token` với env, trả `{ "hub.challenge": ... }`).
  - `POST`: ghi event vào bảng `strava_events (id, object_type, object_id, aspect_type, owner_id, updates jsonb, event_time, received_at, processed_at, error text, attempts int)` rồi trả 200 ngay. Không gọi Strava trong request này.
- Xử lý hàng đợi `strava_events` (job chạy mỗi phút bằng Vercel Cron gọi `/api/cron/strava-events`, có `CRON_SECRET`):
  - `activity create/update` → `getActivity` (chi tiết) → upsert `activities` + `activity_best_efforts`. Event `update` chỉ đổi `title`/`type`/`private` thì vẫn lấy lại chi tiết (đơn giản, ít lỗi).
  - `activity delete` → xoá dòng.
  - `athlete update authorized=false` → luồng thu hồi ở task 2.3.
  - Owner không phải thành viên (không có token) → bỏ qua, đánh dấu processed.
  - Lỗi thì tăng `attempts`, thử lại theo backoff, quá 5 lần ghi `error` để BCN xem.
- Script `npm run strava:subscribe` tạo/xem/xoá subscription (gọi `POST/GET/DELETE /push_subscriptions`).
- Sau khi upsert activity: gọi hàm SQL làm mới tổng hợp (06) và tính lại challenge liên quan (07). Hai bước này để hook rỗng ở task này, task sau điền.

Nghiệm thu:
- [ ] `strava:subscribe` trên preview/production thành công (Strava gọi GET xác thực).
- [ ] Ghi một hoạt động trên Strava: trong ≤ 2 phút có dòng trong `activities`, có `best_efforts`.
- [ ] Đổi tên hoạt động trên Strava → tên trong app đổi. Xoá → mất.
- [ ] Gửi lặp lại cùng event 2 lần → không nhân đôi dữ liệu.

Pitfall:
- Vercel Cron bản miễn phí giới hạn tần suất. Nếu không chạy được mỗi phút: dùng `pg_cron` + `pg_net` trong Supabase gọi route, hoặc xử lý luôn trong `after()` của Next ngay sau khi trả 200 (vẫn giữ cron làm lưới an toàn).

---

## Task 3.4 – Kéo lịch sử ⚠️

Làm:
- Bảng `backfill_jobs (member_id pk, from_date, cursor_before timestamptz, page int, status, last_run_at, error)`.
- Khi thành viên được duyệt: tạo job kéo từ **01/01 năm trước** tới nay (quyết định tạm; đủ cho thống kê năm và PR gần đây).
- Job `/api/cron/backfill` mỗi 15 phút: lấy N job, `listActivities` 200/trang, upsert bản tóm tắt (chưa có best efforts). Dừng khi `canSpend('background')` false.
- Job thứ hai lấy chi tiết (best efforts) cho hoạt động chạy `detail_fetched = false`, ưu tiên hoạt động mới, chỉ chạy khi dư hạn mức.
- Trang `/me` hiện trạng thái: "Đang đồng bộ lịch sử: đã có 312 hoạt động, đến 03/2025".

Nghiệm thu:
- [ ] Với 2–3 tài khoản thật: lịch sử về đủ, số hoạt động khớp Strava (đếm tay một tháng).
- [ ] Giả lập usage gần ngưỡng (sửa `strava_rate_state`): job dừng, lần sau chạy tiếp đúng trang.
- [ ] Webhook vẫn xử lý bình thường khi backfill đang chạy.

---

## Task 3.5 – Luật hợp lệ

Làm:
- `src/config/activityRules.ts` + `src/lib/strava/validity.ts` (hàm thuần + test): một hoạt động **được tính** cho thống kê CLB/challenge khi:
  - `sport_type` thuộc danh sách cho phép (mặc định `Run`, `TrailRun`, `VirtualRun`),
  - không `manual` (cấu hình được),
  - pace trung bình chậm hơn ngưỡng nhanh nhất (ví dụ không nhanh hơn 2:50/km, chống đạp xe ghi thành chạy),
  - không bị BCN `flagged_invalid`.
- Lưu kết quả vào cột tính sẵn `activities.counts_for_club bool` (cập nhật khi upsert và khi đổi config bằng hàm SQL chạy lại).
- `/admin/activities`: danh sách hoạt động bị luật loại + nút đánh dấu hợp lệ/không hợp lệ, ghi `audit_logs`.

Nghiệm thu:
- [ ] Test các ca: chạy máy (`VirtualRun`) tính; đạp xe không tính; nhập tay không tính; pace 2:30/km không tính.
- [ ] BCN đánh dấu một hoạt động không hợp lệ → biến khỏi thống kê và challenge của người đó.

---

## Task 3.6 – Theo dõi đồng bộ cho BCN

Làm:
- `/admin/sync`: hạn mức Strava đang dùng (15 phút / ngày), số event chưa xử lý, event lỗi (bấm thử lại), số job backfill còn lại, thành viên mất kết nối (token hỏng).

Nghiệm thu:
- [ ] Trang hiện đúng số khi so với bảng trong Supabase Studio.

---

## Câu hỏi cho BCN
- Challenge có tính **chạy máy** (VirtualRun/treadmill) và **đi bộ** không?
- Kéo lịch sử từ đầu năm trước là đủ chưa, hay cần lâu hơn (ví dụ để tính PR từ khi tham gia CLB)?
