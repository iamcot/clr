import { describe, expect, it } from 'vitest'
import { buildLevelInput, levelWindowStart } from '@/lib/stats/levelInput'

describe('levelWindowStart', () => {
  it('cửa sổ 12 tháng gồm cả tháng hiện tại', () => {
    expect(levelWindowStart(new Date('2026-10-24T03:00:00Z'), 12)).toBe('2025-11-01')
  })
})

describe('buildLevelInput', () => {
  const rows = [
    { memberId: 'a', periodStart: '2025-10-01', distanceMeters: 99_000, activeDays: 20 },
    { memberId: 'a', periodStart: '2025-11-01', distanceMeters: 100_000, activeDays: 10 },
    { memberId: 'a', periodStart: '2026-10-01', distanceMeters: 50_000, activeDays: 5 },
    { memberId: 'b', periodStart: '2026-10-01', distanceMeters: 1_000, activeDays: 1 },
  ]

  it('chỉ cộng tháng trong cửa sổ của đúng thành viên', () => {
    const input = buildLevelInput('a', rows, ['5k'], '2025-11-01', 2)
    expect(input).toEqual({ distanceMeters: 150_000, activeDays: 15, completedChallenges: 2, prDistanceNames: ['5k'] })
  })
})
