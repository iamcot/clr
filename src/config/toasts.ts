export type ToastKind = 'success' | 'error'

export type ToastMessage = { kind: ToastKind; text: string }

export const FLASH_COOKIE_NAME = 'clr_flash'
export const FLASH_COOKIE_MAX_AGE_SECONDS = 60
export const TOAST_DURATION_MS = 4000

export const FLASH_TOASTS = {
  profile_saved: { kind: 'success', text: 'Đã lưu hồ sơ' },
  challenge_saved: { kind: 'success', text: 'Đã lưu challenge' },
  challenge_cloned: {
    kind: 'success',
    text: 'Đã tạo bản nháp, kiểm tra lại rồi công bố',
  },
  post_saved: { kind: 'success', text: 'Đã lưu bài viết' },
  post_deleted: { kind: 'success', text: 'Đã xoá bài viết' },
  event_saved: { kind: 'success', text: 'Đã lưu event' },
  activities_linked: { kind: 'success', text: 'Đã quét và gắn hoạt động cho người tham gia' },
  checkin_done: { kind: 'success', text: 'Điểm danh thành công' },
  checkin_already: { kind: 'success', text: 'Bạn đã điểm danh rồi' },
  checkin_expired: { kind: 'error', text: 'Mã điểm danh đã hết hạn, hãy quét lại mã mới trên máy BCN' },
  checkin_closed: { kind: 'error', text: 'Chưa tới hoặc đã quá giờ điểm danh của event này' },
  checkin_failed: { kind: 'error', text: 'Không điểm danh được, vui lòng thử lại' },
  race_saved: { kind: 'success', text: 'Đã lưu kết quả giải' },
  strava_disconnected: {
    kind: 'success',
    text: 'Đã ngắt kết nối Strava và xoá dữ liệu đã đồng bộ',
  },
} as const satisfies Record<string, ToastMessage>

export type FlashCode = keyof typeof FLASH_TOASTS
