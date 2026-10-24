import { KM_GOAL_TYPES, type GoalType } from '@/config/challenges'
import { toVietnamInputValue } from '@/lib/format/dateTime'
import type { ActivityFilter } from '@/lib/challenges/types'
import { ruleToFormValues, type PenaltyRule, type RewardRule } from '@/lib/challenges/rules'

const METERS_PER_KM = 1000

type DefaultsSource = {
  id: string | null
  title: string
  description: string
  coverUrl: string | null
  startsAt: string
  endsAt: string
  goalType: GoalType
  participation: string
  registrationClosesAt: string | null
  ranking: string
  filter: ActivityFilter
  penaltyRule: PenaltyRule
  rewardRule: RewardRule
  categories: {
    id: string
    name: string
    goalValue: number
    gender: string | null
    memberType: string | null
  }[]
}

function paceText(seconds: number | undefined): string {
  if (!seconds) return ''
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function kmText(meters: number | undefined): string {
  return meters ? String(meters / METERS_PER_KM) : ''
}

// Giá trị ban đầu của form sửa challenge, ngược với parseChallengeInput
export function toFormDefaults(source: DefaultsSource): Record<string, string> {
  const rules = ruleToFormValues(source.penaltyRule, source.rewardRule)
  const values: Record<string, string> = {
    id: source.id ?? '',
    title: source.title,
    description: source.description,
    cover_url: source.coverUrl ?? '',
    starts_at: toVietnamInputValue(source.startsAt),
    ends_at: toVietnamInputValue(source.endsAt),
    goal_type: source.goalType,
    participation: source.participation,
    registration_closes_at: source.registrationClosesAt ? toVietnamInputValue(source.registrationClosesAt) : '',
    ranking: source.ranking,
    min_distance_km: kmText(source.filter.min_distance_m),
    max_pace: paceText(source.filter.max_pace_s_per_km),
    min_pace: paceText(source.filter.min_pace_s_per_km),
    max_km_per_day: kmText(source.filter.max_distance_per_day_m),
    window_start: source.filter.time_window ? String(source.filter.time_window.start_hour) : '',
    window_end: source.filter.time_window ? String(source.filter.time_window.end_hour) : '',
    fail_amount: rules.failAmount ? String(rules.failAmount) : '',
    low_amount: rules.lowAmount ? String(rules.lowAmount) : '',
    low_threshold_pct: String(rules.lowThresholdPct),
    reward_top_n: rules.rewardTopN ? String(rules.rewardTopN) : '',
    reward_title: rules.rewardTitle,
    reward_amount: rules.rewardAmount ? String(rules.rewardAmount) : '',
  }
  if (rules.exemptFree) values.exempt_free = 'on'

  const goalDivisor = KM_GOAL_TYPES.includes(source.goalType) ? METERS_PER_KM : 1
  source.categories.forEach((category, index) => {
    values[`cat_${index}_id`] = category.id
    values[`cat_${index}_name`] = category.name
    values[`cat_${index}_goal`] = String(category.goalValue / goalDivisor)
    values[`cat_${index}_gender`] = category.gender ?? ''
    values[`cat_${index}_type`] = category.memberType ?? ''
  })
  return values
}

export const NEW_CHALLENGE_DEFAULTS: Record<string, string> = {
  goal_type: 'total_distance',
  participation: 'mandatory_official',
  ranking: 'value_desc',
  low_threshold_pct: '50',
  cat_0_name: 'Chung',
}
