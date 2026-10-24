import { describe, expect, it } from 'vitest'
import { parsePeriodValue, periodRange, shiftPeriod, summarizeEvents } from '@/lib/events/eventStats'

const rows = [
  { eventId: 'a', title: 'A', startsAt: '2026-10-05T22:00:00Z', registeredCount: 20, attendedCount: 15, totalDistanceM: 120_000 },
  { eventId: 'b', title: 'B', startsAt: '2026-10-19T22:00:00Z', registeredCount: 10, attendedCount: 10, totalDistanceM: 80_000 },
]

describe('summarizeEvents', () => {
  it('cộng dồn và tính tỉ lệ đến thực tế', () => {
    expect(summarizeEvents(rows)).toEqual({
      eventCount: 2,
      registrations: 30,
      attended: 25,
      attendanceRate: 25 / 30,
      totalDistanceM: 200_000,
    })
  })

  it('không có đăng ký thì không có tỉ lệ', () => {
    expect(summarizeEvents([]).attendanceRate).toBeNull()
  })
})

describe('periodRange', () => {
  it('tháng theo ranh giới nửa đêm giờ Việt Nam', () => {
    expect(periodRange('month', '2026-10')).toEqual({ from: '2026-09-30T17:00:00.000Z', to: '2026-10-31T17:00:00.000Z' })
  })

  it('tháng 12 sang năm sau', () => {
    expect(periodRange('month', '2026-12').to).toBe('2026-12-31T17:00:00.000Z')
  })

  it('năm', () => {
    expect(periodRange('year', '2026')).toEqual({ from: '2025-12-31T17:00:00.000Z', to: '2026-12-31T17:00:00.000Z' })
  })
})

describe('parsePeriodValue', () => {
  const now = new Date('2026-10-23T05:00:00Z')

  it('giữ giá trị hợp lệ, sai thì lấy kỳ hiện tại', () => {
    expect(parsePeriodValue('month', '2026-03', now)).toBe('2026-03')
    expect(parsePeriodValue('month', 'abc', now)).toBe('2026-10')
    expect(parsePeriodValue('year', undefined, now)).toBe('2026')
  })
})

describe('shiftPeriod', () => {
  it('lùi và tiến theo tháng, năm', () => {
    expect(shiftPeriod('month', '2026-01', -1)).toBe('2025-12')
    expect(shiftPeriod('month', '2026-12', 1)).toBe('2027-01')
    expect(shiftPeriod('year', '2026', -1)).toBe('2025')
  })
})
