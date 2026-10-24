import type { GoalType } from '@/config/challenges'

export type ActivityFilter = {
  min_distance_m?: number
  max_pace_s_per_km?: number
  min_pace_s_per_km?: number
  sport_types?: string[]
  max_distance_per_day_m?: number
  time_window?: { start_hour: number; end_hour: number }
}

export type ScoringChallenge = {
  startsAt: string
  endsAt: string
  goalType: GoalType
  filter: ActivityFilter
}

export type ScoringActivity = {
  id: number
  startDate: string
  distanceMeters: number
  movingTimeSeconds: number
  elapsedTimeSeconds: number
  elevationGainMeters: number
  sportType: string
}

export type CountedActivity = { activityId: number; countedValue: number }
export type ExcludedActivity = { activityId: number; reason: string }

export type ScoreResult = {
  value: number
  progressPct: number
  completed: boolean
  completedAt: string | null
  lastActivityAt: string | null
  counted: CountedActivity[]
  excluded: ExcludedActivity[]
}
