const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const MAX_RELATIVE_DAYS = 7

// 'Vừa xong', '5 phút trước', '2 ngày trước'; quá một tuần thì để người gọi hiện ngày cụ thể (trả null)
export function formatRelativeVi(iso: string, now: Date): string | null {
  const elapsed = Math.max(0, now.getTime() - Date.parse(iso))
  if (elapsed < MINUTE_MS) return 'Vừa xong'
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} phút trước`
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)} giờ trước`
  const days = Math.floor(elapsed / DAY_MS)
  return days <= MAX_RELATIVE_DAYS ? `${days} ngày trước` : null
}
