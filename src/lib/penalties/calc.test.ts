import { describe, expect, it } from 'vitest'
import { currentMonthVn, monthRangeVn, summarizePenalties, transferNote } from '@/lib/penalties/calc'

describe('monthRangeVn', () => {
  it('đổi tháng giờ Việt Nam sang khoảng UTC', () => {
    expect(monthRangeVn('2026-11')).toEqual({
      from: '2026-10-31T17:00:00.000Z',
      to: '2026-11-30T17:00:00.000Z',
    })
  })

  it('qua năm mới', () => {
    expect(monthRangeVn('2026-12')?.to).toBe('2026-12-31T17:00:00.000Z')
  })

  it('từ chối định dạng sai', () => {
    expect(monthRangeVn('2026-13')).toBeNull()
    expect(monthRangeVn('abc')).toBeNull()
  })
})

describe('currentMonthVn', () => {
  it('tính theo giờ Việt Nam', () => {
    expect(currentMonthVn(new Date('2026-10-31T18:00:00Z'))).toBe('2026-11')
  })
})

describe('summarizePenalties', () => {
  it('gộp theo trạng thái', () => {
    expect(
      summarizePenalties([
        { amount: 100000, status: 'paid' },
        { amount: 200000, status: 'unpaid' },
        { amount: 50000, status: 'waived' },
        { amount: 100000, status: 'unpaid' },
      ]),
    ).toEqual({ collected: 100000, outstanding: 300000, waived: 50000 })
  })
})

describe('transferNote', () => {
  it('ghép mã thành viên, PHAT và tháng', () => {
    expect(transferNote('CLR0123', new Date('2026-11-05T00:00:00Z'))).toBe('CLR0123 PHAT T11')
  })
})
