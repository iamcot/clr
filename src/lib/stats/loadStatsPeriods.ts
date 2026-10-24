import 'server-only'
import { STATS_CHART_MONTHS, STATS_CHART_WEEKS } from '@/config/levels'
import { lastMonthStarts, lastWeekStarts, yearStartVN } from '@/lib/stats/periods'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type StatsPeriodType = 'week' | 'month' | 'year'

export type PeriodStats = {
  periodStart: string
  activityCount: number
  distanceMeters: number
  movingTimeSeconds: number
  elevationGainMeters: number
  longestMeters: number
  activeDays: number
}

const EMPTY_STATS = {
  activityCount: 0,
  distanceMeters: 0,
  movingTimeSeconds: 0,
  elevationGainMeters: 0,
  longestMeters: 0,
  activeDays: 0,
}

export function periodStartsFor(type: StatsPeriodType, now: Date): string[] {
  if (type === 'week') return lastWeekStarts(now, STATS_CHART_WEEKS)
  if (type === 'month') return lastMonthStarts(now, STATS_CHART_MONTHS)
  const currentYear = Number(yearStartVN(now).slice(0, 4))
  return [`${currentYear - 1}-01-01`, `${currentYear}-01-01`]
}

// Trả đủ các kỳ cần hiển thị (kỳ không có hoạt động thì toàn số 0), cũ nhất trước
export async function loadOwnStatsPeriods(memberId: string, type: StatsPeriodType, now: Date): Promise<PeriodStats[]> {
  const starts = periodStartsFor(type, now)
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('member_stats_period')
    .select('*')
    .eq('member_id', memberId)
    .eq('period_type', type)
    .gte('period_start', starts[0] ?? '1970-01-01')
  const byStart = new Map((data ?? []).map((row) => [row.period_start, row]))
  return starts.map((periodStart) => {
    const row = byStart.get(periodStart)
    if (!row) return { periodStart, ...EMPTY_STATS }
    return {
      periodStart,
      activityCount: row.activity_count,
      distanceMeters: row.distance_m,
      movingTimeSeconds: row.moving_time_s,
      elevationGainMeters: Number(row.elevation_gain_m),
      longestMeters: row.longest_m,
      activeDays: row.active_days,
    }
  })
}

export async function loadOwnMonthAndYear(memberId: string, now: Date) {
  const [months, years] = await Promise.all([
    loadOwnStatsPeriods(memberId, 'month', now),
    loadOwnStatsPeriods(memberId, 'year', now),
  ])
  const empty = { periodStart: '', ...EMPTY_STATS }
  return { month: months[months.length - 1] ?? empty, year: years[years.length - 1] ?? empty }
}
