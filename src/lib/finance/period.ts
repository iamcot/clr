const VN_OFFSET_MS = 7 * 3600 * 1000
const MONTHS_PER_QUARTER = 3
const PERIOD_PATTERN = /^(\d{4})(?:-(0[1-9]|1[0-2])|-Q([1-4]))?$/

export type ReportPeriodType = 'month' | 'quarter' | 'year'

export type ReportPeriod = {
  type: ReportPeriodType
  key: string
  label: string
  from: string
  to: string
  firstMonth: string
  lastMonth: string
}

function vnMonthStart(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 1) - VN_OFFSET_MS).toISOString()
}

function monthKey(year: number, monthIndex: number): string {
  const date = new Date(Date.UTC(year, monthIndex, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// Kỳ báo cáo: '2026-10' (tháng), '2026-Q4' (quý), '2026' (năm); khoảng [from, to) theo giờ Việt Nam
export function parseReportPeriod(value: string | undefined): ReportPeriod | null {
  const match = PERIOD_PATTERN.exec(value ?? '')
  if (!match) return null
  const year = Number(match[1])
  if (match[2]) {
    const monthIndex = Number(match[2]) - 1
    return {
      type: 'month',
      key: `${year}-${match[2]}`,
      label: `Tháng ${Number(match[2])}/${year}`,
      from: vnMonthStart(year, monthIndex),
      to: vnMonthStart(year, monthIndex + 1),
      firstMonth: monthKey(year, monthIndex),
      lastMonth: monthKey(year, monthIndex),
    }
  }
  if (match[3]) {
    const startIndex = (Number(match[3]) - 1) * MONTHS_PER_QUARTER
    return {
      type: 'quarter',
      key: `${year}-Q${match[3]}`,
      label: `Quý ${match[3]}/${year}`,
      from: vnMonthStart(year, startIndex),
      to: vnMonthStart(year, startIndex + MONTHS_PER_QUARTER),
      firstMonth: monthKey(year, startIndex),
      lastMonth: monthKey(year, startIndex + MONTHS_PER_QUARTER - 1),
    }
  }
  return {
    type: 'year',
    key: String(year),
    label: `Năm ${year}`,
    from: vnMonthStart(year, 0),
    to: vnMonthStart(year + 1, 0),
    firstMonth: monthKey(year, 0),
    lastMonth: monthKey(year, 11),
  }
}

export function currentPeriodKey(type: ReportPeriodType, now: Date): string {
  const local = new Date(now.getTime() + VN_OFFSET_MS)
  const year = local.getUTCFullYear()
  const monthIndex = local.getUTCMonth()
  if (type === 'month') return monthKey(year, monthIndex)
  if (type === 'quarter') return `${year}-Q${Math.floor(monthIndex / MONTHS_PER_QUARTER) + 1}`
  return String(year)
}

// Kỳ liền trước (delta -1) hoặc liền sau (delta 1)
export function shiftPeriodKey(key: string, delta: number): string | null {
  const period = parseReportPeriod(key)
  if (!period) return null
  const [yearText = '', rest = ''] = period.key.split('-')
  const year = Number(yearText)
  if (period.type === 'year') return String(year + delta)
  if (period.type === 'month') return monthKey(year, Number(rest) - 1 + delta)
  const quarterIndex = Number(rest.slice(1)) - 1 + delta
  const shiftedYear = year + Math.floor(quarterIndex / 4)
  return `${shiftedYear}-Q${(((quarterIndex % 4) + 4) % 4) + 1}`
}

export function monthStartDate(key: string): string | null {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(key) ? `${key}-01` : null
}
