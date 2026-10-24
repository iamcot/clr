import { describe, expect, it } from 'vitest'
import { formatVnd } from '@/lib/format/money'

describe('formatVnd', () => {
  it('ngăn cách hàng nghìn bằng dấu chấm', () => {
    expect(formatVnd(1250000)).toBe('1.250.000đ')
    expect(formatVnd(0)).toBe('0đ')
  })
})
