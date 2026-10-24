import { formatDateVi } from '@/lib/format/dateTime'
import { formatKm } from '@/lib/stats/format'
import type { ChartBar } from '@/components/StatsBarChart'
import type { PeriodStats, StatsPeriodType } from '@/lib/stats/loadStatsPeriods'

export const PERIOD_TABS: { type: StatsPeriodType; label: string }[] = [
  { type: 'week', label: 'Tuần' },
  { type: 'month', label: 'Tháng' },
  { type: 'year', label: 'Năm' },
]

export function parsePeriodType(value: string | undefined): StatsPeriodType {
  return PERIOD_TABS.find((tab) => tab.type === value)?.type ?? 'month'
}

function barLabel(type: StatsPeriodType, periodStart: string): string {
  if (type === 'year') return periodStart.slice(0, 4)
  if (type === 'month') return `Tháng ${Number(periodStart.slice(5, 7))}/${periodStart.slice(0, 4)}`
  return `Tuần ${formatDateVi(`${periodStart}T00:00:00+07:00`)}`
}

export function toChartBars(type: StatsPeriodType, periods: PeriodStats[]): ChartBar[] {
  return periods.map((period) => ({
    label: barLabel(type, period.periodStart),
    value: period.distanceMeters,
    display: formatKm(period.distanceMeters),
  }))
}

// Ngày đầu của kỳ kế tiếp, dùng làm cận trên khi lấy ngày chạy trong kỳ
export function nextPeriodStart(type: StatsPeriodType, periodStart: string): string {
  const date = new Date(`${periodStart}T00:00:00Z`)
  if (type === 'week') date.setUTCDate(date.getUTCDate() + 7)
  if (type === 'month') date.setUTCMonth(date.getUTCMonth() + 1)
  if (type === 'year') date.setUTCFullYear(date.getUTCFullYear() + 1)
  return date.toISOString().slice(0, 10)
}
