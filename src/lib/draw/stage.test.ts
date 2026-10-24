import { describe, expect, it } from 'vitest'
import {
  clamp01,
  hashUnit,
  isWinnerRevealable,
  packPosition,
  reelFillerName,
  reelLayout,
  spinProgress,
  winnerPosition,
} from '@/lib/draw/stage'

describe('hashUnit', () => {
  it('cố định theo khoá và nằm trong [0, 1)', () => {
    expect(hashUnit('abc')).toBe(hashUnit('abc'))
    expect(hashUnit('abc')).not.toBe(hashUnit('abd'))
    for (const key of ['a', 'b', 'xyz', '123']) {
      expect(hashUnit(key)).toBeGreaterThanOrEqual(0)
      expect(hashUnit(key)).toBeLessThan(1)
    }
  })
})

describe('spinProgress / isWinnerRevealable', () => {
  it('tiến độ chạy từ 0 tới 1', () => {
    expect(spinProgress(0, 1000, 11000)).toBe(0)
    expect(spinProgress(6000, 1000, 11000)).toBe(0.5)
    expect(spinProgress(20000, 1000, 11000)).toBe(1)
  })

  it('chỉ lộ người trúng trong 1,5 giây cuối', () => {
    expect(isWinnerRevealable(9400, 11000)).toBe(false)
    expect(isWinnerRevealable(9500, 11000)).toBe(true)
  })
})

describe('đua: vị trí', () => {
  const keys = Array.from({ length: 300 }, (_, index) => `m${index}`)

  it('chưa biết người thắng thì không ai tới đích', () => {
    for (let step = 0; step <= 100; step += 1) {
      for (const key of keys) expect(packPosition(key, step / 100)).toBeLessThanOrEqual(0.93)
    }
  })

  it('có vượt nhau: người dẫn đầu thay đổi theo thời gian', () => {
    const leaderAt = (progress: number) => keys.reduce((best, key) => (packPosition(key, progress) > packPosition(best, progress) ? key : best))
    const leaders = new Set([0.1, 0.3, 0.5, 0.7, 0.9].map(leaderAt))
    expect(leaders.size).toBeGreaterThan(1)
  })

  it('người thắng về đúng đích (1) khi hết giờ và liền mạch lúc bắt đầu bứt tốc', () => {
    const dashStart = 0.9
    expect(winnerPosition('w', 1, dashStart)).toBe(1)
    expect(winnerPosition('w', dashStart, dashStart)).toBeCloseTo(packPosition('w', dashStart), 10)
    expect(winnerPosition('w', 0.5, dashStart)).toBe(packPosition('w', 0.5))
  })

  it('người thắng không bị lùi trong lúc bứt tốc', () => {
    const dashStart = 0.9
    let previous = winnerPosition('w', dashStart, dashStart)
    for (let step = 91; step <= 100; step += 1) {
      const next = winnerPosition('w', step / 100, dashStart)
      expect(next).toBeGreaterThanOrEqual(previous - 0.0001)
      previous = next
    }
  })
})

describe('reelLayout', () => {
  const base = { startedAtMs: 0, revealAtMs: 10000, itemHeightPx: 56, speedPxPerMs: 1.4 }

  it('chưa biết người trúng thì cuộn đều', () => {
    expect(reelLayout({ ...base, nowMs: 1000, winnerSeenAtMs: null })).toEqual({ offsetPx: 1400, winnerIndex: null })
  })

  it('biết người trúng thì dừng đúng ô giữa tại revealAt dù biết sớm hay muộn', () => {
    for (const seenAt of [8500, 9000, 9800]) {
      const end = reelLayout({ ...base, nowMs: 10000, winnerSeenAtMs: seenAt })
      expect(end.winnerIndex).not.toBeNull()
      expect(end.offsetPx).toBeCloseTo(((end.winnerIndex ?? 0) - 1) * 56, 5)
    }
  })

  it('liền mạch tại lúc biết người trúng', () => {
    const before = reelLayout({ ...base, nowMs: 8499, winnerSeenAtMs: 8500 })
    const after = reelLayout({ ...base, nowMs: 8501, winnerSeenAtMs: 8500 })
    expect(Math.abs(after.offsetPx - before.offsetPx)).toBeLessThan(10)
  })

  it('không bao giờ lùi', () => {
    let previous = 0
    for (let now = 0; now <= 10000; now += 100) {
      const { offsetPx } = reelLayout({ ...base, nowMs: now, winnerSeenAtMs: 8500 })
      expect(offsetPx).toBeGreaterThanOrEqual(previous - 0.001)
      previous = offsetPx
    }
  })
})

describe('reelFillerName / clamp01', () => {
  it('tên đệm cố định theo lượt và ô', () => {
    expect(reelFillerName(['A', 'B', 'C'], 2, 7)).toBe(reelFillerName(['A', 'B', 'C'], 2, 7))
    expect(reelFillerName([], 1, 1)).toBe('')
  })

  it('kẹp trong 0..1', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
  })
})
