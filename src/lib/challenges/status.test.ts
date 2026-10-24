import { describe, expect, it } from 'vitest'
import { canRegister, challengePhase, summarizeProgress } from '@/lib/challenges/status'

const START = '2026-10-31T17:00:00Z'
const END = '2026-11-30T16:59:59Z'

describe('challengePhase', () => {
  it('sắp diễn ra, đang diễn ra, đã kết thúc theo thời gian', () => {
    expect(challengePhase('published', START, END, new Date('2026-10-20T00:00:00Z'))).toBe('upcoming')
    expect(challengePhase('published', START, END, new Date('2026-11-10T00:00:00Z'))).toBe('running')
    expect(challengePhase('running', START, END, new Date('2026-12-02T00:00:00Z'))).toBe('ended')
  })

  it('đang chốt hoặc đã chốt là đã kết thúc', () => {
    expect(challengePhase('finalizing', START, END, new Date('2026-11-10T00:00:00Z'))).toBe('ended')
    expect(challengePhase('closed', START, END, new Date('2026-11-10T00:00:00Z'))).toBe('ended')
  })
})

describe('canRegister', () => {
  it('chỉ challenge tự đăng ký còn hạn', () => {
    const now = new Date('2026-11-10T00:00:00Z')
    expect(canRegister('opt_in', 'running', END, null, now)).toBe(true)
    expect(canRegister('opt_in', 'running', END, '2026-11-05T00:00:00Z', now)).toBe(false)
    expect(canRegister('mandatory_official', 'running', END, null, now)).toBe(false)
    expect(canRegister('opt_in', 'draft', END, null, now)).toBe(false)
  })
})

describe('summarizeProgress', () => {
  it('tính phần còn thiếu và mức cần mỗi ngày', () => {
    const summary = summarizeProgress(100_000, 40_000, '2026-11-20T00:00:00Z', new Date('2026-11-10T00:00:00Z'), true)
    expect(summary).toEqual({
      remaining: 60_000,
      daysLeft: 10,
      neededPerDay: 6000,
    })
  })

  it('mục tiêu một buổi không có mức mỗi ngày', () => {
    expect(
      summarizeProgress(21_000, 0, '2026-11-20T00:00:00Z', new Date('2026-11-10T00:00:00Z'), false).neededPerDay,
    ).toBeNull()
  })

  it('đã đủ thì còn thiếu 0', () => {
    expect(summarizeProgress(10, 15, '2026-11-20T00:00:00Z', new Date('2026-11-10T00:00:00Z'), true).remaining).toBe(0)
  })
})
