import { describe, expect, it } from 'vitest'
import {
  buildPenaltyRule,
  buildRewardRule,
  parsePenaltyRule,
  parseRewardRule,
  ruleToFormValues,
} from '@/lib/challenges/rules'

const VALUES = {
  failAmount: 100_000,
  lowAmount: 200_000,
  lowThresholdPct: 50,
  exemptFree: true,
  rewardTopN: 3,
  rewardTitle: 'Top 3',
  rewardAmount: 0,
}

describe('buildPenaltyRule', () => {
  it('đặt luật "dưới ngưỡng" trước luật "không đạt"', () => {
    const rule = buildPenaltyRule(VALUES)
    expect(rule.penalties.map((item) => item.type)).toEqual(['challenge_low', 'challenge_fail'])
    expect(rule.penalties[0]?.progress_below).toBe(0.5)
    expect(rule.exempt_member_types).toEqual(['free'])
  })

  it('số tiền 0 thì bỏ luật đó', () => {
    const rule = buildPenaltyRule({ ...VALUES, lowAmount: 0, failAmount: 0 })
    expect(rule.penalties).toEqual([])
  })
})

describe('buildRewardRule', () => {
  it('top N với tiêu đề', () => {
    expect(buildRewardRule(VALUES).rewards[0]).toMatchObject({
      rank: 3,
      per_category: true,
      title: 'Top 3',
    })
  })

  it('không có tiêu đề thì không có thưởng', () => {
    expect(buildRewardRule({ ...VALUES, rewardTitle: ' ' }).rewards).toEqual([])
  })
})

describe('parse và ruleToFormValues', () => {
  it('đọc lại đúng luật đã dựng', () => {
    const penalty = parsePenaltyRule(JSON.parse(JSON.stringify(buildPenaltyRule(VALUES))))
    const reward = parseRewardRule(JSON.parse(JSON.stringify(buildRewardRule(VALUES))))
    expect(ruleToFormValues(penalty, reward)).toEqual(VALUES)
  })

  it('bỏ phần tử sai định dạng', () => {
    expect(
      parsePenaltyRule({
        penalties: [{ when: 'x' }, { when: 'not_completed', type: 'a', amount: 5 }],
      }).penalties,
    ).toHaveLength(1)
    expect(parseRewardRule(null).rewards).toEqual([])
  })
})
