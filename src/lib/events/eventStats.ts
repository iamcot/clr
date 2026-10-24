const VN_OFFSET_MS = 7 * 3600 * 1000

export type StatsPeriod = 'month' | 'year'

export type EventStatsRow = {
  eventId: string
  title: string
  startsAt: string
  registeredCount: number
  attendedCount: number
  totalDistanceM: number
}

export type EventStatsSummary = {
  eventCount: number
  registrations: number
  attended: number
  attendanceRate: number | null
  totalDistanceM: number
}

export function summarizeEvents(rows: EventStatsRow[]): EventStatsSummary {
  const registrations = rows.reduce((sum, row) => sum + row.registeredCount, 0)
  const attended = rows.reduce((sum, row) => sum + row.attendedCount, 0)
  return {
    eventCount: rows.length,
    registrations,
    attended,
    attendanceRate: registrations > 0 ? attended / registrations : null,
    totalDistanceM: rows.reduce((sum, row) => sum + row.totalDistanceM, 0),
  }
}

// Kỳ thống kê tính theo lịch Việt Nam; value là '2026-10' (tháng) hoặc '2026' (năm), sai định dạng thì lấy kỳ hiện tại
export function parsePeriodValue(period: StatsPeriod, value: string | undefined, now: Date): string {
  const pattern = period === 'month' ? /^\d{4}-(0[1-9]|1[0-2])$/ : /^\d{4}$/
  if (value && pattern.test(value)) return value
  const local = new Date(now.getTime() + VN_OFFSET_MS).toISOString()
  return period === 'month' ? local.slice(0, 7) : local.slice(0, 4)
}

function vietnamMidnightUtc(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 1) - VN_OFFSET_MS).toISOString()
}

export function periodRange(period: StatsPeriod, value: string): { from: string; to: string } {
  const [yearText = '', monthText = ''] = value.split('-')
  const year = Number(yearText)
  if (period === 'year') return { from: vietnamMidnightUtc(year, 0), to: vietnamMidnightUtc(year + 1, 0) }
  const monthIndex = Number(monthText) - 1
  return { from: vietnamMidnightUtc(year, monthIndex), to: vietnamMidnightUtc(year, monthIndex + 1) }
}

export function shiftPeriod(period: StatsPeriod, value: string, step: number): string {
  if (period === 'year') return String(Number(value) + step)
  const [yearText = '', monthText = ''] = value.split('-')
  const shifted = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + step, 1))
  return shifted.toISOString().slice(0, 7)
}
