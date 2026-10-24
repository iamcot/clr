import { describe, expect, it } from 'vitest'
import { estimateClockOffset, pickBetterOffset } from '@/lib/draw/clockOffset'

describe('estimateClockOffset', () => {
  it('server nhanh hơn client 5 giây, độ trễ đối xứng', () => {
    expect(estimateClockOffset(15_100, 10_000, 10_200)).toBe(5000)
  })

  it('đồng hồ khớp nhau thì lệch 0', () => {
    expect(estimateClockOffset(10_100, 10_000, 10_200)).toBe(0)
  })
})

describe('pickBetterOffset', () => {
  it('giữ ước lượng có độ trễ khứ hồi thấp hơn', () => {
    const fast = { offsetMs: 100, roundTripMs: 50 }
    const slow = { offsetMs: 400, roundTripMs: 900 }
    expect(pickBetterOffset(fast, slow)).toBe(fast)
    expect(pickBetterOffset(slow, fast)).toBe(fast)
    expect(pickBetterOffset(null, slow)).toBe(slow)
  })
})
