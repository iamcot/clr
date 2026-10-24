export type PenaltyRuleItem = {
  when: 'not_completed'
  progress_below?: number
  type: string
  amount: number
}

export type PenaltyRule = {
  penalties: PenaltyRuleItem[]
  exempt_member_types: string[]
}

export type RewardRuleItem = {
  when: 'rank_lte'
  rank: number
  per_category: boolean
  completed_only: boolean
  title: string
  amount: number | null
}

export type RewardRule = { rewards: RewardRuleItem[] }

export const EMPTY_PENALTY_RULE: PenaltyRule = {
  penalties: [],
  exempt_member_types: [],
}
export const EMPTY_REWARD_RULE: RewardRule = { rewards: [] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePenaltyItem(raw: unknown): PenaltyRuleItem | null {
  if (!isRecord(raw) || raw.when !== 'not_completed') return null
  if (typeof raw.type !== 'string' || typeof raw.amount !== 'number' || raw.amount < 0) return null
  const item: PenaltyRuleItem = {
    when: 'not_completed',
    type: raw.type,
    amount: raw.amount,
  }
  if (typeof raw.progress_below === 'number') item.progress_below = raw.progress_below
  return item
}

export function parsePenaltyRule(raw: unknown): PenaltyRule {
  if (!isRecord(raw)) return EMPTY_PENALTY_RULE
  const penalties = Array.isArray(raw.penalties) ? raw.penalties.flatMap((item) => parsePenaltyItem(item) ?? []) : []
  const exempt = Array.isArray(raw.exempt_member_types)
    ? raw.exempt_member_types.filter((item): item is string => typeof item === 'string')
    : []
  return { penalties, exempt_member_types: exempt }
}

function parseRewardItem(raw: unknown): RewardRuleItem | null {
  if (!isRecord(raw) || raw.when !== 'rank_lte') return null
  if (typeof raw.rank !== 'number' || raw.rank < 1 || typeof raw.title !== 'string') return null
  return {
    when: 'rank_lte',
    rank: raw.rank,
    per_category: raw.per_category !== false,
    completed_only: raw.completed_only !== false,
    title: raw.title,
    amount: typeof raw.amount === 'number' && raw.amount > 0 ? raw.amount : null,
  }
}

export function parseRewardRule(raw: unknown): RewardRule {
  if (!isRecord(raw) || !Array.isArray(raw.rewards)) return EMPTY_REWARD_RULE
  return {
    rewards: raw.rewards.flatMap((item) => parseRewardItem(item) ?? []),
  }
}

export type RuleFormValues = {
  failAmount: number
  lowAmount: number
  lowThresholdPct: number
  exemptFree: boolean
  rewardTopN: number
  rewardTitle: string
  rewardAmount: number
}

// Luật phạt: xét từ trên xuống, mỗi người chỉ khớp luật đầu tiên (xem settle.ts)
export function buildPenaltyRule(values: RuleFormValues): PenaltyRule {
  const penalties: PenaltyRuleItem[] = []
  if (values.lowAmount > 0 && values.lowThresholdPct > 0) {
    penalties.push({
      when: 'not_completed',
      progress_below: values.lowThresholdPct / 100,
      type: 'challenge_low',
      amount: values.lowAmount,
    })
  }
  if (values.failAmount > 0)
    penalties.push({
      when: 'not_completed',
      type: 'challenge_fail',
      amount: values.failAmount,
    })
  return { penalties, exempt_member_types: values.exemptFree ? ['free'] : [] }
}

export function buildRewardRule(values: RuleFormValues): RewardRule {
  if (values.rewardTopN < 1 || !values.rewardTitle.trim()) return EMPTY_REWARD_RULE
  return {
    rewards: [
      {
        when: 'rank_lte',
        rank: values.rewardTopN,
        per_category: true,
        completed_only: true,
        title: values.rewardTitle.trim(),
        amount: values.rewardAmount > 0 ? values.rewardAmount : null,
      },
    ],
  }
}

// Ngược lại: đọc luật đã lưu để điền sẵn vào form
export function ruleToFormValues(penaltyRule: PenaltyRule, rewardRule: RewardRule): RuleFormValues {
  const low = penaltyRule.penalties.find((item) => item.progress_below !== undefined)
  const fail = penaltyRule.penalties.find((item) => item.progress_below === undefined)
  const reward = rewardRule.rewards[0]
  return {
    failAmount: fail?.amount ?? 0,
    lowAmount: low?.amount ?? 0,
    lowThresholdPct: low?.progress_below !== undefined ? Math.round(low.progress_below * 100) : 50,
    exemptFree: penaltyRule.exempt_member_types.includes('free'),
    rewardTopN: reward?.rank ?? 0,
    rewardTitle: reward?.title ?? '',
    rewardAmount: reward?.amount ?? 0,
  }
}
