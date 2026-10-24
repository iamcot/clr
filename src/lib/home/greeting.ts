const VN_OFFSET_MS = 7 * 3600 * 1000
const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function vietnamTime(moment: Date): Date {
  return new Date(moment.getTime() + VN_OFFSET_MS)
}

export function greetingForHour(hour: number): string {
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 13) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function greetingAt(moment: Date): string {
  return greetingForHour(vietnamTime(moment).getUTCHours())
}

// Ví dụ 'Thứ Năm, 23/10'
export function formatWeekdayDate(moment: Date): string {
  const local = vietnamTime(moment)
  const day = String(local.getUTCDate()).padStart(2, '0')
  const month = String(local.getUTCMonth() + 1).padStart(2, '0')
  return `${WEEKDAY_LABELS[local.getUTCDay()]}, ${day}/${month}`
}

export function monthNumberAt(moment: Date): number {
  return vietnamTime(moment).getUTCMonth() + 1
}

// Tên người Việt gọi bằng chữ cuối: 'Nguyễn Văn Minh' -> 'Minh'
export function givenName(displayName: string | null): string {
  const words = (displayName ?? '').trim().split(/\s+/).filter(Boolean)
  return words[words.length - 1] ?? 'bạn'
}
