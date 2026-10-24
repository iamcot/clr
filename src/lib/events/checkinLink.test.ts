import { describe, expect, it } from 'vitest'
import { buildCheckinLink } from '@/lib/events/checkinLink'

describe('buildCheckinLink', () => {
  it('ghép link điểm danh kèm mã', () => {
    expect(buildCheckinLink('https://clr.vn', 'e1', 'abc')).toBe('https://clr.vn/events/e1/checkin?code=abc')
  })

  it('bỏ dấu / cuối của origin và mã hoá ký tự đặc biệt', () => {
    expect(buildCheckinLink('https://clr.vn/', 'e1', 'a+b')).toBe('https://clr.vn/events/e1/checkin?code=a%2Bb')
  })
})
