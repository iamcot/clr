import { ACTIVITY_RULES, type ActivityRules } from '@/config/activityRules'

export type ActivityRuleInput = {
  sport_type: string
  manual: boolean
  distance_m: number
  moving_time_s: number
}

function paceSecondsPerKm(activity: ActivityRuleInput): number | null {
  if (activity.distance_m <= 0) return null
  return activity.moving_time_s / (activity.distance_m / 1000)
}

export function passesActivityRules(activity: ActivityRuleInput, rules: ActivityRules = ACTIVITY_RULES): boolean {
  if (!rules.allowedSportTypes.includes(activity.sport_type)) return false
  if (activity.manual && !rules.allowManual) return false

  const pace = paceSecondsPerKm(activity)
  if (pace === null) return false
  return pace >= rules.fastestPaceSecondsPerKm
}
