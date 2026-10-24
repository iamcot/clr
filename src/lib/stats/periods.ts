const VN_OFFSET_MS = 7 * 3600 * 1000
const DAY_MS = 24 * 3600 * 1000

// Ngày theo lịch Việt Nam dạng 'YYYY-MM-DD' của một thời điểm
export function vietnamDate(moment: Date): string {
  return new Date(moment.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)
}

function addDays(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

// Thứ Hai đầu tuần (giờ Việt Nam) chứa thời điểm đó
export function weekStartVN(moment: Date): string {
  const date = vietnamDate(moment)
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  return addDays(date, -daysSinceMonday)
}

export function monthStartVN(moment: Date): string {
  return `${vietnamDate(moment).slice(0, 7)}-01`
}

export function yearStartVN(moment: Date): string {
  return `${vietnamDate(moment).slice(0, 4)}-01-01`
}

// Danh sách đầu tuần, cũ nhất trước, kết thúc ở tuần chứa `moment`
export function lastWeekStarts(moment: Date, count: number): string[] {
  const current = weekStartVN(moment)
  return Array.from({ length: count }, (_, index) => addDays(current, -7 * (count - 1 - index)))
}

export function addMonths(monthStart: string, months: number): string {
  const year = Number(monthStart.slice(0, 4))
  const month = Number(monthStart.slice(5, 7)) - 1 + months
  const shiftedYear = year + Math.floor(month / 12)
  const shiftedMonth = ((month % 12) + 12) % 12
  return `${shiftedYear}-${String(shiftedMonth + 1).padStart(2, '0')}-01`
}

export function lastMonthStarts(moment: Date, count: number): string[] {
  const current = monthStartVN(moment)
  return Array.from({ length: count }, (_, index) => addMonths(current, -(count - 1 - index)))
}

// Phần trăm thay đổi so với kỳ trước; null khi kỳ trước bằng 0 (không có gì để so)
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

// Chuỗi ngày liên tiếp dài nhất trong danh sách ngày 'YYYY-MM-DD' (có thể trùng, chưa sắp xếp)
export function longestStreak(dates: readonly string[]): number {
  const sorted = [...new Set(dates)].sort()
  let longest = 0
  let current = 0
  let previous: string | null = null
  for (const date of sorted) {
    current = previous !== null && addDays(previous, 1) === date ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = date
  }
  return longest
}
