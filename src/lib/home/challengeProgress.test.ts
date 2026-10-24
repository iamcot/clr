import { describe, expect, it } from 'vitest'
import { daysLeft, describeRemaining } from '@/lib/home/challengeProgress'

describe('daysLeft', () => {
  it('làm tròn lên số ngày còn lại', () => {
    expect(daysLeft('2026-10-31T17:00:00Z', new Date('2026-10-23T05:00:00Z'))).toBe(9)
  })

  it('không âm khi đã hết hạn', () => {
    expect(daysLeft('2026-10-01T00:00:00Z', new Date('2026-10-23T05:00:00Z'))).toBe(0)
  })
})

describe('describeRemaining', () => {
  it('mục tiêu km: còn bao nhiêu km, bao nhiêu ngày, trung bình mỗi ngày', () => {
    expect(describeRemaining('total_distance', 150_000, 142_600, 8)).toBe('Còn 7,4 km trong 8 ngày · khoảng 1 km/ngày')
  })

  it('đã đạt mục tiêu', () => {
    expect(describeRemaining('total_distance', 150_000, 150_000, 8)).toBe('Bạn đã hoàn thành mục tiêu')
  })

  it('mục tiêu không phải km thì không có km/ngày', () => {
    expect(describeRemaining('active_days', 12, 9, 5)).toBe('Còn 3 ngày trong 5 ngày')
  })

  it('hết hạn trong hôm nay', () => {
    expect(describeRemaining('total_distance', 100_000, 95_000, 0)).toBe('Còn 5,0 km trong hôm nay')
  })
})
