import { describe, expect, it } from 'vitest'
import { currentPeriodKey, monthStartDate, parseReportPeriod, shiftPeriodKey } from '@/lib/finance/period'

describe('parseReportPeriod', () => {
  it('đọc tháng theo giờ Việt Nam', () => {
    expect(parseReportPeriod('2026-10')).toMatchObject({
      type: 'month',
      label: 'Tháng 10/2026',
      from: '2026-09-30T17:00:00.000Z',
      to: '2026-10-31T17:00:00.000Z',
    })
  })

  it('đọc quý gồm ba tháng', () => {
    expect(parseReportPeriod('2026-Q4')).toMatchObject({
      type: 'quarter',
      from: '2026-09-30T17:00:00.000Z',
      to: '2026-12-31T17:00:00.000Z',
      firstMonth: '2026-10',
      lastMonth: '2026-12',
    })
  })

  it('đọc cả năm', () => {
    expect(parseReportPeriod('2026')).toMatchObject({
      type: 'year',
      from: '2025-12-31T17:00:00.000Z',
      to: '2026-12-31T17:00:00.000Z',
    })
  })

  it('từ chối giá trị sai', () => {
    expect(parseReportPeriod('2026-13')).toBeNull()
    expect(parseReportPeriod('2026-Q5')).toBeNull()
    expect(parseReportPeriod('abc')).toBeNull()
    expect(parseReportPeriod(undefined)).toBeNull()
  })
})

describe('currentPeriodKey', () => {
  const now = new Date('2026-10-31T18:00:00Z')

  it('tính theo giờ Việt Nam (đã sang ngày 1/11)', () => {
    expect(currentPeriodKey('month', now)).toBe('2026-11')
    expect(currentPeriodKey('quarter', now)).toBe('2026-Q4')
    expect(currentPeriodKey('year', now)).toBe('2026')
  })
})

describe('shiftPeriodKey', () => {
  it('chuyển sang kỳ trước và sau, qua ranh giới năm', () => {
    expect(shiftPeriodKey('2026-01', -1)).toBe('2025-12')
    expect(shiftPeriodKey('2026-12', 1)).toBe('2027-01')
    expect(shiftPeriodKey('2026-Q1', -1)).toBe('2025-Q4')
    expect(shiftPeriodKey('2026-Q4', 1)).toBe('2027-Q1')
    expect(shiftPeriodKey('2026', -1)).toBe('2025')
  })
})

describe('monthStartDate', () => {
  it('chỉ nhận khoá tháng', () => {
    expect(monthStartDate('2026-10')).toBe('2026-10-01')
    expect(monthStartDate('2026-Q4')).toBeNull()
  })
})
