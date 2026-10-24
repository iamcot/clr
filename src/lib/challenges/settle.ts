import type { PenaltyRule, RewardRule } from '@/lib/challenges/rules'

export type SettleEntry = {
  memberId: string
  categoryId: string
  memberType: string | null
  progressPct: number
  completed: boolean
  rank: number | null
  excluded: boolean
  penaltyWaived: boolean
}

export type PlannedPenalty = {
  memberId: string
  typeCode: string
  amount: number
  reason: string
}
export type PlannedReward = {
  memberId: string
  title: string
  amount: number | null
  reason: string
}

export type SettlePlan = {
  penalties: PlannedPenalty[]
  rewards: PlannedReward[]
}

const PERCENT = 100

function isPenaltyExempt(entry: SettleEntry, rule: PenaltyRule): boolean {
  if (entry.excluded || entry.penaltyWaived || entry.completed) return true
  return entry.memberType !== null && rule.exempt_member_types.includes(entry.memberType)
}

// Luật xét từ trên xuống, mỗi người chỉ khớp luật phạt đầu tiên
function planPenalties(entries: SettleEntry[], rule: PenaltyRule): PlannedPenalty[] {
  return entries.flatMap((entry) => {
    if (isPenaltyExempt(entry, rule)) return []
    const matched = rule.penalties.find(
      (item) => item.progress_below === undefined || entry.progressPct < item.progress_below * PERCENT,
    )
    if (!matched) return []
    return [
      {
        memberId: entry.memberId,
        typeCode: matched.type,
        amount: matched.amount,
        reason: `Hoàn thành ${Math.round(entry.progressPct)}% mục tiêu`,
      },
    ]
  })
}

function planRewards(entries: SettleEntry[], rule: RewardRule): PlannedReward[] {
  return rule.rewards.flatMap((item) =>
    entries
      .filter((entry) => !entry.excluded && entry.rank !== null && entry.rank <= item.rank)
      .filter((entry) => !item.completed_only || entry.completed)
      .map((entry) => ({
        memberId: entry.memberId,
        title: item.title,
        amount: item.amount,
        reason: `Hạng ${entry.rank}`,
      })),
  )
}

export function settleChallenge(entries: SettleEntry[], penaltyRule: PenaltyRule, rewardRule: RewardRule): SettlePlan {
  return {
    penalties: planPenalties(entries, penaltyRule),
    rewards: planRewards(entries, rewardRule),
  }
}
