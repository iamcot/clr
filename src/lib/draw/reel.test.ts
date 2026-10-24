import { describe, expect, it } from 'vitest'
import { buildReelNames, easeOutCubic, reelProgress } from '@/lib/draw/reel'

describe('buildReelNames', () => {
  const names = ['A', 'B', 'C', 'D']

  it('kết thúc bằng người trúng và đủ độ dài', () => {
    const reel = buildReelNames(names, 'C', 2, 10)
    expect(reel).toHaveLength(10)
    expect(reel.at(-1)).toBe('C')
  })

  it('cùng đầu vào thì mọi máy ra cùng dãy', () => {
    expect(buildReelNames(names, 'C', 2, 10)).toEqual(buildReelNames(names, 'C', 2, 10))
  })
})

describe('reelProgress', () => {
  it('chạy từ 0 đến 1 trong khoảng cuối trước revealAt', () => {
    expect(reelProgress(0, 10000, 5000)).toBe(0)
    expect(reelProgress(5000, 10000, 5000)).toBe(0)
    expect(reelProgress(7500, 10000, 5000)).toBe(0.5)
    expect(reelProgress(12000, 10000, 5000)).toBe(1)
  })
})

describe('easeOutCubic', () => {
  it('chậm dần về cuối và kẹp trong 0..1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    expect(easeOutCubic(2)).toBe(1)
  })
})
