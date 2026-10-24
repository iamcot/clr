export type LevelRule = {
  level: number
  name: string
  minDistanceMeters: number
  minActiveDays: number
  requiredPrs: readonly string[]
}

// Điều kiện tính trên 12 tháng lịch gần nhất (tháng hiện tại và 11 tháng trước). Đây là số tạm, BCN sửa ở đây
export const LEVEL_RULES: readonly LevelRule[] = [
  { level: 1, name: 'Tân binh', minDistanceMeters: 0, minActiveDays: 0, requiredPrs: [] },
  { level: 2, name: 'Chăm chỉ', minDistanceMeters: 300_000, minActiveDays: 50, requiredPrs: [] },
  { level: 3, name: 'Bền bỉ', minDistanceMeters: 800_000, minActiveDays: 100, requiredPrs: [] },
  { level: 4, name: 'Chiến binh', minDistanceMeters: 1_500_000, minActiveDays: 150, requiredPrs: ['half-marathon'] },
  { level: 5, name: 'Huyền thoại', minDistanceMeters: 2_500_000, minActiveDays: 200, requiredPrs: ['marathon'] },
]

export const CLUB_POINT_WEIGHTS = {
  perKm: 1,
  perActiveDay: 2,
  perCompletedChallenge: 50,
} as const

export const LEVEL_WINDOW_MONTHS = 12
export const RANKING_PAGE_SIZE = 50
export const STATS_CHART_WEEKS = 12
export const STATS_CHART_MONTHS = 12
export const MEMBER_BATCH_SIZE = 50
