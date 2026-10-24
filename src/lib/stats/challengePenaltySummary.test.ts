import { describe, expect, it } from 'vitest'
import { summarizeChallengePenalty } from '@/lib/stats/challengePenaltySummary'

describe('summarizeChallengePenalty', () => {
  it('đếm challenge đã tham gia, hoàn thành, số lần phạt và tiền còn nợ', () => {
    const summary = summarizeChallengePenalty(
      [
        { id: 'a', title: 'A', progressPct: 100, completed: true },
        { id: 'b', title: 'B', progressPct: 40, completed: false },
      ],
      [
        { amount: 50_000, status: 'unpaid' },
        { amount: 30_000, status: 'paid' },
        { amount: 20_000, status: 'waived' },
      ],
    )
    expect(summary).toEqual({ joinedCount: 2, completedCount: 1, penaltyCount: 2, unpaidAmount: 50_000 })
  })

  it('chưa có dữ liệu thì toàn số 0', () => {
    expect(summarizeChallengePenalty([], [])).toEqual({ joinedCount: 0, completedCount: 0, penaltyCount: 0, unpaidAmount: 0 })
  })
})
