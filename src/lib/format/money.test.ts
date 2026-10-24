import { describe, expect, it } from 'vitest'
import { formatVnd, formatVndCompact } from '@/lib/format/money'

describe('formatVnd', () => {
  it('ngăn cách hàng nghìn bằng dấu chấm', () => {
    expect(formatVnd(1250000)).toBe('1.250.000đ')
    expect(formatVnd(0)).toBe('0đ')
  })
})

describe('formatVndCompact', () => {
  it('đổi hàng nghìn thành k', () => {
    expect(formatVndCompact(20000)).toBe('20k')
    expect(formatVndCompact(1500)).toBe('1,5k')
  })

  it('đổi hàng triệu thành m, bỏ số 0 thừa', () => {
    expect(formatVndCompact(2100000)).toBe('2,1m')
    expect(formatVndCompact(48650000)).toBe('48,65m')
    expect(formatVndCompact(3000000)).toBe('3m')
  })

  it('giữ nguyên số nhỏ và số 0', () => {
    expect(formatVndCompact(0)).toBe('0')
    expect(formatVndCompact(500)).toBe('500')
  })

  it('giữ dấu âm', () => {
    expect(formatVndCompact(-7850000)).toBe('-7,85m')
  })
})
