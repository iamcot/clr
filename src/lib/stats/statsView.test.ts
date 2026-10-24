import { describe, expect, it } from 'vitest'
import { nextPeriodStart, parsePeriodType, toChartBars } from '@/lib/stats/statsView'

describe('parsePeriodType', () => {
  it('mặc định là tháng', () => {
    expect(parsePeriodType(undefined)).toBe('month')
    expect(parsePeriodType('lạ')).toBe('month')
    expect(parsePeriodType('week')).toBe('week')
  })
})

describe('nextPeriodStart', () => {
  it('tính đầu kỳ kế tiếp', () => {
    expect(nextPeriodStart('week', '2026-10-19')).toBe('2026-10-26')
    expect(nextPeriodStart('month', '2026-12-01')).toBe('2027-01-01')
    expect(nextPeriodStart('year', '2026-01-01')).toBe('2027-01-01')
  })
})

describe('toChartBars', () => {
  it('đổi km sang chuỗi hiển thị', () => {
    const bars = toChartBars('month', [
      {
        periodStart: '2026-10-01',
        activityCount: 1,
        distanceMeters: 12340,
        movingTimeSeconds: 0,
        elevationGainMeters: 0,
        longestMeters: 0,
        activeDays: 1,
      },
    ])
    expect(bars[0]).toMatchObject({ label: 'Tháng 10/2026', display: '12,3 km' })
  })
})
