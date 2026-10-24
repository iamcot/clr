const VN_OFFSET_MS = 7 * 3600 * 1000

type LocalParts = { year: number; month: number; day: number; rest: string }

function toLocalParts(iso: string): LocalParts {
  const local = new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString()
  return {
    year: Number(local.slice(0, 4)),
    month: Number(local.slice(5, 7)),
    day: Number(local.slice(8, 10)),
    rest: local.slice(11),
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

// Dời mốc thời gian theo số tháng lịch (giờ VN). Mốc rơi vào ngày cuối tháng thì giữ là ngày cuối tháng mới
export function shiftMonths(iso: string, months: number): string {
  const { year, month, day, rest } = toLocalParts(iso)
  const wasLastDay = day === daysInMonth(year, month)
  const index = year * 12 + (month - 1) + months
  const newYear = Math.floor(index / 12)
  const newMonth = (index % 12) + 1
  const lastDay = daysInMonth(newYear, newMonth)
  const newDay = wasLastDay ? lastDay : Math.min(day, lastDay)
  const pad = (value: number) => String(value).padStart(2, '0')
  return new Date(Date.parse(`${newYear}-${pad(newMonth)}-${pad(newDay)}T${rest.slice(0, 12)}+07:00`)).toISOString()
}

// Số tháng cần dời để mẫu rơi vào tháng kế tiếp tính từ `now`
export function monthsUntilNextMonth(templateStartIso: string, now: Date): number {
  const template = toLocalParts(templateStartIso)
  const current = toLocalParts(now.toISOString())
  return current.year * 12 + current.month - (template.year * 12 + template.month) + 1
}
