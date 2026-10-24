import { describe, expect, it } from 'vitest'
import { distanceMeters, matchEventActivities, parsePoint, type MatchableActivity } from '@/lib/events/matchActivity'

const HOUR = 3600 * 1000
const RULES = { windowMs: HOUR, radiusMeters: 3000 }
const EVENT = {
  startsAt: '2026-10-25T22:15:00Z',
  endsAt: '2026-10-26T00:00:00Z',
  point: { lat: 21.0545, lng: 105.8227 },
}

function activity(overrides: Partial<MatchableActivity>): MatchableActivity {
  return {
    activityId: 1,
    memberId: 'm1',
    startDate: '2026-10-25T22:20:00Z',
    distanceMeters: 10_000,
    startPoint: '(21.0550,105.8230)',
    isPrivate: false,
    privateCountsInTotals: false,
    ...overrides,
  }
}

describe('parsePoint', () => {
  it('đọc kiểu point của Postgres', () => {
    expect(parsePoint('(21.0545,105.8227)')).toEqual({ lat: 21.0545, lng: 105.8227 })
  })

  it('null hoặc sai định dạng thì null', () => {
    expect(parsePoint(null)).toBeNull()
    expect(parsePoint('21.05,105.8')).toBeNull()
  })
})

describe('distanceMeters', () => {
  it('xấp xỉ 111 km cho 1 độ vĩ', () => {
    const meters = distanceMeters({ lat: 21, lng: 105 }, { lat: 22, lng: 105 })
    expect(Math.round(meters / 1000)).toBe(111)
  })
})

describe('matchEventActivities', () => {
  it('gắn hoạt động đúng giờ và gần địa điểm', () => {
    expect(matchEventActivities(EVENT, [activity({})], RULES).get('m1')).toBe(1)
  })

  it('bỏ hoạt động ngoài khung giờ', () => {
    const early = activity({ startDate: '2026-10-25T20:00:00Z' })
    expect(matchEventActivities(EVENT, [early], RULES).size).toBe(0)
  })

  it('bỏ hoạt động xuất phát xa địa điểm hoặc không có điểm xuất phát', () => {
    const far = activity({ startPoint: '(21.2000,105.8227)' })
    const noPoint = activity({ activityId: 2, startPoint: null })
    expect(matchEventActivities(EVENT, [far, noPoint], RULES).size).toBe(0)
  })

  it('hoạt động riêng tư chỉ tính khi chủ đồng ý', () => {
    const hidden = activity({ isPrivate: true })
    const allowed = activity({ memberId: 'm2', isPrivate: true, privateCountsInTotals: true })
    const result = matchEventActivities(EVENT, [hidden, allowed], RULES)
    expect(result.has('m1')).toBe(false)
    expect(result.has('m2')).toBe(true)
  })

  it('mỗi người lấy buổi dài nhất', () => {
    const short = activity({ activityId: 1, distanceMeters: 2000 })
    const long = activity({ activityId: 2, distanceMeters: 10_000 })
    expect(matchEventActivities(EVENT, [short, long], RULES).get('m1')).toBe(2)
  })

  it('event không có toạ độ thì không gắn', () => {
    expect(matchEventActivities({ ...EVENT, point: null }, [activity({})], RULES).size).toBe(0)
  })
})
