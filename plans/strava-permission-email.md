# Mẫu email xin phép Strava

Gửi tới: `developers@strava.com` (kiểm lại địa chỉ liên hệ hiện hành ở trang developers.strava.com trước khi gửi).
Người gửi: email chung của CLB, tài khoản đứng tên app Strava.
Gửi cùng lúc hoặc ngay sau đơn xin nâng giới hạn app (Developer Program form). Điền các chỗ `[...]` trước khi gửi.

---

**Subject:** Permission request: private, opt-in club app for CLR Running Club (Client ID [CLIENT_ID])

Hello Strava Developer team,

I am writing on behalf of CLR Running Club, an amateur running club in [Ho Chi Minh City], Vietnam, with about 600 members. We are building a small web app for our members only and would like to confirm that our planned use of the Strava API complies with the API Agreement before we launch.

**What the app is**
- A private club app (PWA). It is not public, not listed anywhere and not a commercial product. Only approved club members can sign in. Our club committee approves each account by hand.
- Members sign in with "Connect with Strava". We read their activities through the API and webhooks (scopes `read`, `activity:read_all`) to show them their own stats, PRs and progress in monthly club challenges.
- We do not sell data, show ads, share data with third parties, or use Strava data to train any AI or machine learning model.

**What we would like to show to other members, and only with opt-in**
- Each member chooses whether to share. Sharing is **off by default**. On first connection the member sees a clear opt-in screen and can turn it off at any time in settings.
- Only members who have opted in appear on club challenge leaderboards. Members who have not opted in only see their own data, and nobody else sees theirs.
- For opted-in members, other club members would see: display name, profile photo, and progress in a club challenge (for example "73% of the 100 km monthly goal", plus rank). We would prefer to also show total distance for the challenge period, but we can limit it to percentage only if you prefer.
- We will **never** show other users: maps, routes, polylines, start locations, private activities, heart rate, or individual activity details.
- Everything is visible only to signed-in, approved club members, never to the public.

**Data handling**
- Tokens are encrypted and stored server side only.
- When a member disconnects or revokes access, we delete their Strava data from our database right away, and the deauthorization webhook is handled automatically.
- We follow the Strava Brand Guidelines ("Connect with Strava" button, "Powered by Strava" attribution, "View on Strava" links).

**Our questions**
1. Is an opt-in leaderboard like this, visible only inside a private club app, allowed under the current API Agreement?
2. If yes, may we show total distance for the challenge period, or only percentage and rank?
3. If no, is there an approved way for a club to run its own monthly challenges using members' Strava data?

We would also like to request a capacity increase for this app (about 600 athletes). Screenshots of the login screen, the opt-in screen and the leaderboard are attached.

Thank you for your time. We want to do this the right way, and we will follow your guidance.

Best regards,
[Name], [Role, e.g. Club Committee member]
CLR Running Club, [Strava club link]
[Email] · [Phone]

---

## Đính kèm nên có
- Ảnh chụp màn hình: trang đăng nhập (nút Connect with Strava chính thức), màn opt-in, bảng xếp hạng (chỉ người đã opt-in), trang cài đặt có nút tắt chia sẻ và ngắt kết nối.
- Link Strava club của CLR.

## Sau khi gửi
- Ghi ngày gửi và câu trả lời vào `plans/PROGRESS.md` (task 3.0).
- Chưa có trả lời thì chạy app ở chế độ `self_only` hoặc `percent_only` với opt-in (xem task 3.0).
