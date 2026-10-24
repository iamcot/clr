import { describe, expect, it } from 'vitest'
import { computeClubPoints, computeLevel, levelName } from '@/lib/stats/level'

const base = { distanceMeters: 0, activeDays: 0, completedChallenges: 0, prDistanceNames: [] as string[] }

describe('computeLevel', () => {
  it('đúng ngưỡng 300 km và 50 ngày là level 2', () => {
    expect(computeLevel({ ...base, distanceMeters: 300_000, activeDays: 50 })).toBe(2)
  })

  it('299,9 km vẫn là level 1', () => {
    expect(computeLevel({ ...base, distanceMeters: 299_900, activeDays: 50 })).toBe(1)
  })

  it('đủ km nhưng thiếu ngày chạy thì không lên', () => {
    expect(computeLevel({ ...base, distanceMeters: 900_000, activeDays: 99 })).toBe(2)
  })

  it('level 4 cần PR half marathon', () => {
    const stats = { ...base, distanceMeters: 1_500_000, activeDays: 150 }
    expect(computeLevel(stats)).toBe(3)
    expect(computeLevel({ ...stats, prDistanceNames: ['half-marathon'] })).toBe(4)
  })

  it('level 5 cần PR marathon', () => {
    const stats = { ...base, distanceMeters: 2_500_000, activeDays: 200, prDistanceNames: ['half-marathon'] }
    expect(computeLevel(stats)).toBe(4)
    expect(computeLevel({ ...stats, prDistanceNames: ['half-marathon', 'marathon'] })).toBe(5)
  })

  it('người mới là level 1', () => {
    expect(computeLevel(base)).toBe(1)
  })

  it('dùng cấu hình truyền vào', () => {
    const rules = [
      { level: 1, name: 'A', minDistanceMeters: 0, minActiveDays: 0, requiredPrs: [] },
      { level: 2, name: 'B', minDistanceMeters: 1000, minActiveDays: 1, requiredPrs: [] },
    ]
    const weights = { perKm: 1, perActiveDay: 2, perCompletedChallenge: 50 }
    expect(computeLevel({ ...base, distanceMeters: 1000, activeDays: 1 }, { rules, weights })).toBe(2)
  })
})

describe('computeClubPoints', () => {
  it('cộng km, ngày chạy và challenge hoàn thành theo hệ số', () => {
    expect(computeClubPoints({ ...base, distanceMeters: 100_500, activeDays: 20, completedChallenges: 2 })).toBe(
      Math.round(100.5 + 40 + 100),
    )
  })
})

describe('levelName', () => {
  it('trả tên level', () => {
    expect(levelName(3)).toBe('Bền bỉ')
    expect(levelName(9)).toBe('Level 9')
  })
})
