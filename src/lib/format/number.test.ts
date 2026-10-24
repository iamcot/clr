import { describe, expect, it } from 'vitest'
import { formatFixed, formatNumber } from '@/lib/format/number'

describe('formatNumber', () => {
  it('ngăn phần nghìn bằng dấu chấm', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('bỏ phần thập phân thừa', () => {
    expect(formatNumber(2.5, 1)).toBe('2,5')
    expect(formatNumber(2, 1)).toBe('2')
  })
})

describe('formatFixed', () => {
  it('luôn đủ số chữ số thập phân', () => {
    expect(formatFixed(1234.5, 1)).toBe('1.234,5')
    expect(formatFixed(3, 2)).toBe('3,00')
  })
})
