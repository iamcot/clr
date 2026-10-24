import { describe, expect, it } from 'vitest'
import { suggestRaceActivity } from '@/lib/races/suggestActivity'

const activities = [
  { id: 1, startDateLocal: '2026-04-12T05:30:00', distanceMeters: 21300 },
  { id: 2, startDateLocal: '2026-04-12T04:00:00', distanceMeters: 3000 },
  { id: 3, startDateLocal: '2026-04-11T05:30:00', distanceMeters: 21100 },
]

describe('suggestRaceActivity', () => {
  it('chọn hoạt động cùng ngày có cự ly gần giải', () => {
    expect(suggestRaceActivity('2026-04-12', 21097, activities)?.id).toBe(1)
  })

  it('không gợi ý khi không có hoạt động phù hợp', () => {
    expect(suggestRaceActivity('2026-04-13', 21097, activities)).toBeNull()
    expect(suggestRaceActivity('2026-04-12', 42195, activities)).toBeNull()
  })
})
