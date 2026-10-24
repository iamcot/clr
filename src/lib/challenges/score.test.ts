import { describe, expect, it } from 'vitest'
import { rejectionReason, scoreEntry } from '@/lib/challenges/score'
import type { ScoringActivity, ScoringChallenge } from '@/lib/challenges/types'

// Tháng 11/2026 giờ VN: từ 01/11 00:00 (+07) đến 30/11 23:59:59 (+07)
const BASE: ScoringChallenge = {
  startsAt: '2026-10-31T17:00:00Z',
  endsAt: '2026-11-30T16:59:59Z',
  goalType: 'total_distance',
  filter: {},
}

let nextId = 1
function run(startDate: string, distanceMeters: number, overrides: Partial<ScoringActivity> = {}): ScoringActivity {
  return {
    id: nextId++,
    startDate,
    distanceMeters,
    movingTimeSeconds: distanceMeters * 0.33,
    elapsedTimeSeconds: distanceMeters * 0.33,
    elevationGainMeters: 0,
    sportType: 'Run',
    ...overrides,
  }
}

describe('lọc từng buổi', () => {
  it('buổi 1,8 km khi yêu cầu tối thiểu 2 km thì không tính và có lý do', () => {
    const challenge = { ...BASE, filter: { min_distance_m: 2000 } }
    const result = scoreEntry(challenge, 100_000, [run('2026-11-02T00:00:00Z', 1800)])
    expect(result.value).toBe(0)
    expect(result.excluded[0]?.reason).toBe('Ngắn hơn 2 km')
  })

  it('pace chậm hơn ngưỡng không tính (đi bộ)', () => {
    const challenge = { ...BASE, filter: { max_pace_s_per_km: 540 } }
    const walk = run('2026-11-02T00:00:00Z', 5000, {
      movingTimeSeconds: 5000 * 0.8,
    })
    expect(rejectionReason(walk, challenge)).toBe('Chậm hơn 9:00/km')
  })

  it('khung giờ tính theo giờ Việt Nam', () => {
    const challenge = {
      ...BASE,
      filter: { time_window: { start_hour: 4, end_hour: 9 } },
    }
    expect(rejectionReason(run('2026-11-02T22:30:00Z', 5000), challenge)).toBeNull() // 05:30 VN
    expect(rejectionReason(run('2026-11-02T03:00:00Z', 5000), challenge)).not.toBeNull() // 10:00 VN
  })

  it('lọc theo môn', () => {
    const challenge = { ...BASE, filter: { sport_types: ['Run'] } }
    expect(rejectionReason(run('2026-11-02T00:00:00Z', 5000, { sportType: 'Ride' }), challenge)).toBe(
      'Không đúng môn được tính',
    )
  })
})

describe('ranh giới kỳ', () => {
  it('buổi 23:50 ngày cuối kỳ tính, 00:05 ngày sau không tính', () => {
    const inside = run('2026-11-30T16:50:00Z', 5000) // 23:50 30/11 VN
    const outside = run('2026-11-30T17:05:00Z', 5000) // 00:05 01/12 VN
    const result = scoreEntry(BASE, 100_000, [inside, outside])
    expect(result.value).toBe(5000)
    expect(result.excluded[0]?.reason).toBe('Sau ngày kết thúc challenge')
  })

  it('buổi trước giờ bắt đầu không tính', () => {
    const result = scoreEntry(BASE, 100_000, [run('2026-10-31T16:50:00Z', 5000)])
    expect(result.value).toBe(0)
  })
})

describe('trần km mỗi ngày', () => {
  it('ngày chạy 30 km với trần 21 km chỉ tính 21 km', () => {
    const challenge = { ...BASE, filter: { max_distance_per_day_m: 21_000 } }
    const result = scoreEntry(challenge, 100_000, [run('2026-11-02T00:00:00Z', 30_000)])
    expect(result.value).toBe(21_000)
    expect(result.counted[0]?.countedValue).toBe(21_000)
  })

  it('hai buổi cùng ngày dùng chung trần', () => {
    const challenge = { ...BASE, filter: { max_distance_per_day_m: 21_000 } }
    const result = scoreEntry(challenge, 100_000, [
      run('2026-11-02T00:00:00Z', 15_000),
      run('2026-11-02T08:00:00Z', 15_000),
    ])
    expect(result.value).toBe(21_000)
  })
})

describe('các loại mục tiêu', () => {
  it('active_days: hai buổi cùng ngày là 1 ngày', () => {
    const challenge: ScoringChallenge = { ...BASE, goalType: 'active_days' }
    const result = scoreEntry(challenge, 10, [
      run('2026-11-02T00:00:00Z', 5000),
      run('2026-11-02T09:00:00Z', 5000),
      run('2026-11-03T00:00:00Z', 5000),
    ])
    expect(result.value).toBe(2)
    expect(result.excluded).toHaveLength(1)
  })

  it('activity_count đếm buổi', () => {
    const challenge: ScoringChallenge = { ...BASE, goalType: 'activity_count' }
    const result = scoreEntry(challenge, 2, [run('2026-11-02T00:00:00Z', 5000), run('2026-11-03T00:00:00Z', 5000)])
    expect(result.completed).toBe(true)
  })

  it('total_elevation cộng độ cao', () => {
    const challenge: ScoringChallenge = {
      ...BASE,
      goalType: 'total_elevation',
    }
    const result = scoreEntry(challenge, 300, [
      run('2026-11-02T00:00:00Z', 5000, { elevationGainMeters: 120 }),
      run('2026-11-03T00:00:00Z', 5000, { elevationGainMeters: 200 }),
    ])
    expect(result.value).toBe(320)
    expect(result.completed).toBe(true)
  })

  it('single_distance lấy buổi dài nhất', () => {
    const challenge: ScoringChallenge = {
      ...BASE,
      goalType: 'single_distance',
    }
    const result = scoreEntry(challenge, 21_000, [
      run('2026-11-02T00:00:00Z', 10_000),
      run('2026-11-09T00:00:00Z', 21_500),
    ])
    expect(result.value).toBe(21_500)
    expect(result.completed).toBe(true)
  })
})

describe('hoàn thành', () => {
  it('completed_at là lúc kết thúc buổi làm đủ chỉ tiêu', () => {
    const first = run('2026-11-02T00:00:00Z', 6000)
    const second = run('2026-11-05T00:00:00Z', 5000, {
      elapsedTimeSeconds: 1800,
    })
    const third = run('2026-11-08T00:00:00Z', 5000)
    const result = scoreEntry(BASE, 10_000, [third, first, second])
    expect(result.completed).toBe(true)
    expect(result.completedAt).toBe('2026-11-05T00:30:00.000Z')
    expect(result.progressPct).toBeCloseTo(160)
  })

  it('chưa đủ thì chưa hoàn thành', () => {
    const result = scoreEntry(BASE, 100_000, [run('2026-11-02T00:00:00Z', 5000)])
    expect(result.completed).toBe(false)
    expect(result.completedAt).toBeNull()
    expect(result.progressPct).toBeCloseTo(5)
  })
})
