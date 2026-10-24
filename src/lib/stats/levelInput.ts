import { addMonths, monthStartVN } from '@/lib/stats/periods'
import type { LevelInput } from '@/lib/stats/level'

export type MonthStatsRow = { memberId: string; periodStart: string; distanceMeters: number; activeDays: number }

export function levelWindowStart(now: Date, windowMonths: number): string {
  return addMonths(monthStartVN(now), -(windowMonths - 1))
}

// Cộng các tháng trong cửa sổ; ngày chạy không trùng giữa các tháng nên cộng thẳng được
export function buildLevelInput(
  memberId: string,
  monthRows: readonly MonthStatsRow[],
  prDistanceNames: readonly string[],
  windowStart: string,
  completedChallenges: number,
): LevelInput {
  const inWindow = monthRows.filter((row) => row.memberId === memberId && row.periodStart >= windowStart)
  return {
    distanceMeters: inWindow.reduce((total, row) => total + row.distanceMeters, 0),
    activeDays: inWindow.reduce((total, row) => total + row.activeDays, 0),
    completedChallenges,
    prDistanceNames,
  }
}
