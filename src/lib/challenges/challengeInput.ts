import {
  GOAL_TYPES,
  KM_GOAL_TYPES,
  MAX_CATEGORIES_IN_FORM,
  PARTICIPATION_MODES,
  RANKING_MODES,
  type GoalType,
  type ParticipationMode,
  type RankingMode,
} from '@/config/challenges'
import type { ActivityFilter } from '@/lib/challenges/types'
import { buildPenaltyRule, buildRewardRule, type PenaltyRule, type RewardRule } from '@/lib/challenges/rules'
import { fromVietnamInputValue } from '@/lib/format/dateTime'

const METERS_PER_KM = 1000
const SECONDS_PER_MINUTE = 60

export type CategoryInput = {
  id: string | null
  name: string
  goalValue: number
  gender: string | null
  memberType: string | null
}

export type ChallengeInput = {
  title: string
  description: string
  coverUrl: string | null
  startsAt: string
  endsAt: string
  goalType: GoalType
  categories: CategoryInput[]
  activityFilter: ActivityFilter
  participation: ParticipationMode
  registrationClosesAt: string | null
  ranking: RankingMode
  penaltyRule: PenaltyRule
  rewardRule: RewardRule
}

export type ChallengeInputErrors = Partial<Record<string, string>>
export type ChallengeInputResult = { ok: true; value: ChallengeInput } | { ok: false; errors: ChallengeInputErrors }

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

function decimal(formData: FormData, name: string, errors: ChallengeInputErrors): number {
  const raw = text(formData, name).replace(',', '.')
  if (!raw) return 0
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    errors[name] = 'Nhập số không âm'
    return 0
  }
  return value
}

// "m:ss" hoặc "mm:ss" thành giây trên km
export function parsePaceText(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * SECONDS_PER_MINUTE + Number(match[2])
}

function pace(formData: FormData, name: string, errors: ChallengeInputErrors): number | undefined {
  const raw = text(formData, name)
  if (!raw) return undefined
  const seconds = parsePaceText(raw)
  if (seconds === null || seconds === 0) errors[name] = 'Nhập pace dạng m:ss, ví dụ 9:00'
  return seconds ?? undefined
}

function toBaseUnit(goalType: GoalType, formValue: number): number {
  return KM_GOAL_TYPES.includes(goalType) ? Math.round(formValue * METERS_PER_KM) : formValue
}

function readCategories(formData: FormData, goalType: GoalType, errors: ChallengeInputErrors): CategoryInput[] {
  const categories: CategoryInput[] = []
  for (let index = 0; index < MAX_CATEGORIES_IN_FORM; index++) {
    const name = text(formData, `cat_${index}_name`)
    if (!name) continue
    const goal = decimal(formData, `cat_${index}_goal`, errors)
    if (goal <= 0) errors[`cat_${index}_goal`] = 'Mục tiêu phải lớn hơn 0'
    categories.push({
      id: text(formData, `cat_${index}_id`) || null,
      name,
      goalValue: toBaseUnit(goalType, goal),
      gender: text(formData, `cat_${index}_gender`) || null,
      memberType: text(formData, `cat_${index}_type`) || null,
    })
  }
  if (categories.length === 0) errors.cat_0_name = 'Cần ít nhất một hạng mục'
  return categories
}

function readFilter(formData: FormData, errors: ChallengeInputErrors): ActivityFilter {
  const filter: ActivityFilter = {}
  const minKm = decimal(formData, 'min_distance_km', errors)
  if (minKm > 0) filter.min_distance_m = Math.round(minKm * METERS_PER_KM)
  const maxPace = pace(formData, 'max_pace', errors)
  if (maxPace) filter.max_pace_s_per_km = maxPace
  const minPace = pace(formData, 'min_pace', errors)
  if (minPace) filter.min_pace_s_per_km = minPace
  const dailyKm = decimal(formData, 'max_km_per_day', errors)
  if (dailyKm > 0) filter.max_distance_per_day_m = Math.round(dailyKm * METERS_PER_KM)

  const start = text(formData, 'window_start')
  const end = text(formData, 'window_end')
  if (start || end) {
    const startHour = Number(start)
    const endHour = Number(end)
    const valid =
      Number.isInteger(startHour) &&
      Number.isInteger(endHour) &&
      startHour >= 0 &&
      endHour <= 24 &&
      startHour !== endHour
    if (valid && start && end) filter.time_window = { start_hour: startHour, end_hour: endHour }
    else errors.window_start = 'Nhập giờ bắt đầu và kết thúc khác nhau (0 đến 24)'
  }
  return filter
}

function oneOf<T extends string>(options: readonly T[], value: string, fallback: T): T {
  return options.find((option) => option === value) ?? fallback
}

export function parseChallengeInput(formData: FormData): ChallengeInputResult {
  const errors: ChallengeInputErrors = {}
  const title = text(formData, 'title')
  if (!title) errors.title = 'Nhập tên challenge'

  const startsAt = fromVietnamInputValue(text(formData, 'starts_at'))
  const endsAt = fromVietnamInputValue(text(formData, 'ends_at'))
  if (!startsAt) errors.starts_at = 'Chọn ngày bắt đầu'
  if (!endsAt) errors.ends_at = 'Chọn ngày kết thúc'
  if (startsAt && endsAt && endsAt <= startsAt) errors.ends_at = 'Ngày kết thúc phải sau ngày bắt đầu'

  const registrationText = text(formData, 'registration_closes_at')
  const registrationClosesAt = registrationText ? fromVietnamInputValue(registrationText) : null
  if (registrationText && !registrationClosesAt) errors.registration_closes_at = 'Sai định dạng ngày giờ'

  const goalType = oneOf(GOAL_TYPES, text(formData, 'goal_type'), 'total_distance')
  const ruleValues = {
    failAmount: decimal(formData, 'fail_amount', errors),
    lowAmount: decimal(formData, 'low_amount', errors),
    lowThresholdPct: decimal(formData, 'low_threshold_pct', errors),
    exemptFree: formData.get('exempt_free') === 'on',
    rewardTopN: Math.floor(decimal(formData, 'reward_top_n', errors)),
    rewardTitle: text(formData, 'reward_title'),
    rewardAmount: decimal(formData, 'reward_amount', errors),
  }

  const categories = readCategories(formData, goalType, errors)
  const activityFilter = readFilter(formData, errors)
  if (Object.keys(errors).length > 0 || !startsAt || !endsAt) return { ok: false, errors }

  return {
    ok: true,
    value: {
      title,
      description: text(formData, 'description'),
      coverUrl: text(formData, 'cover_url') || null,
      startsAt,
      endsAt,
      goalType,
      categories,
      activityFilter,
      participation: oneOf(PARTICIPATION_MODES, text(formData, 'participation'), 'opt_in'),
      registrationClosesAt,
      ranking: oneOf(RANKING_MODES, text(formData, 'ranking'), 'value_desc'),
      penaltyRule: buildPenaltyRule(ruleValues),
      rewardRule: buildRewardRule(ruleValues),
    },
  }
}
