import { describe, expect, it } from 'vitest'
import { monthsUntilNextMonth, shiftMonths } from '@/lib/challenges/dates'

describe('shiftMonths', () => {
  it('dời đầu tháng sang tháng sau theo giờ VN', () => {
    // 01/11 00:00 VN = 31/10 17:00Z
    expect(shiftMonths('2026-10-31T17:00:00Z', 1)).toBe('2026-11-30T17:00:00.000Z') // 01/12 00:00 VN
  })

  it('cuối tháng 11 sang cuối tháng 12 (31 ngày)', () => {
    // 30/11 23:59:59 VN
    expect(shiftMonths('2026-11-30T16:59:59Z', 1)).toBe('2026-12-31T16:59:59.000Z')
  })

  it('cuối tháng 1 sang cuối tháng 2', () => {
    expect(shiftMonths('2026-01-31T16:59:59Z', 1)).toBe('2026-02-28T16:59:59.000Z')
  })

  it('qua năm', () => {
    expect(shiftMonths('2026-11-30T16:59:59Z', 2)).toBe('2027-01-31T16:59:59.000Z')
  })
})

describe('monthsUntilNextMonth', () => {
  it('mẫu tháng 11 khi đang tháng 11 thì dời 1 tháng', () => {
    expect(monthsUntilNextMonth('2026-10-31T17:00:00Z', new Date('2026-11-10T03:00:00Z'))).toBe(1)
  })

  it('mẫu tháng 10 khi đang tháng 11 thì dời 2 tháng', () => {
    expect(monthsUntilNextMonth('2026-09-30T17:00:00Z', new Date('2026-11-10T03:00:00Z'))).toBe(2)
  })
})
