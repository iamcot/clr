import { describe, expect, it } from 'vitest'
import { parsePenaltyRule, parseRewardRule } from '@/lib/challenges/rules'
import { settleChallenge, type SettleEntry } from '@/lib/challenges/settle'

const PENALTY_RULE = parsePenaltyRule({
  penalties: [
    {
      when: 'not_completed',
      progress_below: 0.5,
      type: 'challenge_low',
      amount: 200000,
    },
    { when: 'not_completed', type: 'challenge_fail', amount: 100000 },
  ],
  exempt_member_types: ['free'],
})
const REWARD_RULE = parseRewardRule({
  rewards: [{ when: 'rank_lte', rank: 3, per_category: true, title: 'Top 3' }],
})

function entry(overrides: Partial<SettleEntry>): SettleEntry {
  return {
    memberId: 'a',
    categoryId: 'c',
    memberType: 'official',
    progressPct: 0,
    completed: false,
    rank: null,
    excluded: false,
    penaltyWaived: false,
    ...overrides,
  }
}

describe('settleChallenge', () => {
  it('phạt mức thấp khi dưới 50% và không phạt thêm mức không đạt', () => {
    const plan = settleChallenge([entry({ progressPct: 40 })], PENALTY_RULE, REWARD_RULE)
    expect(plan.penalties).toEqual([expect.objectContaining({ typeCode: 'challenge_low', amount: 200000 })])
  })

  it('phạt không đạt khi từ 50% đến dưới 100%', () => {
    const plan = settleChallenge([entry({ progressPct: 80 })], PENALTY_RULE, REWARD_RULE)
    expect(plan.penalties).toEqual([expect.objectContaining({ typeCode: 'challenge_fail', amount: 100000 })])
  })

  it('không phạt người đã hoàn thành', () => {
    const plan = settleChallenge([entry({ progressPct: 100, completed: true })], PENALTY_RULE, REWARD_RULE)
    expect(plan.penalties).toEqual([])
  })

  it('không phạt thành viên tự do, người được miễn và người bị loại', () => {
    const plan = settleChallenge(
      [
        entry({ memberId: 'free', memberType: 'free' }),
        entry({ memberId: 'waived', penaltyWaived: true }),
        entry({ memberId: 'out', excluded: true }),
      ],
      PENALTY_RULE,
      REWARD_RULE,
    )
    expect(plan.penalties).toEqual([])
  })

  it('thưởng top 3 chỉ cho người đã hoàn thành và không bị loại', () => {
    const plan = settleChallenge(
      [
        entry({ memberId: 'one', rank: 1, completed: true }),
        entry({ memberId: 'two', rank: 2, completed: false }),
        entry({ memberId: 'four', rank: 4, completed: true }),
        entry({ memberId: 'out', rank: 3, completed: true, excluded: true }),
      ],
      PENALTY_RULE,
      REWARD_RULE,
    )
    expect(plan.rewards.map((reward) => reward.memberId)).toEqual(['one'])
  })

  it('không có luật thì không sinh gì', () => {
    const plan = settleChallenge([entry({ progressPct: 10 })], parsePenaltyRule(null), parseRewardRule(null))
    expect(plan).toEqual({ penalties: [], rewards: [] })
  })
})
