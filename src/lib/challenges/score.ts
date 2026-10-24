import { vietnamDate } from '@/lib/stats/periods'
import type {
  ActivityFilter,
  CountedActivity,
  ExcludedActivity,
  ScoreResult,
  ScoringActivity,
  ScoringChallenge,
} from '@/lib/challenges/types'

const VN_OFFSET_HOURS = 7
const METERS_PER_KM = 1000

function paceSecondsPerKm(activity: ScoringActivity): number | null {
  if (activity.distanceMeters <= 0) return null
  return activity.movingTimeSeconds / (activity.distanceMeters / METERS_PER_KM)
}

function vietnamHour(startDate: string): number {
  return (new Date(startDate).getUTCHours() + VN_OFFSET_HOURS) % 24
}

function isInsideWindow(hour: number, window: { start_hour: number; end_hour: number }): boolean {
  if (window.start_hour <= window.end_hour) return hour >= window.start_hour && hour < window.end_hour
  return hour >= window.start_hour || hour < window.end_hour
}

function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm)
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}/km`
}

// Lý do hoạt động không được tính, hoặc null nếu hợp lệ. Thứ tự kiểm tra cố định để lý do ổn định.
export function rejectionReason(activity: ScoringActivity, challenge: ScoringChallenge): string | null {
  const time = new Date(activity.startDate).getTime()
  if (time < new Date(challenge.startsAt).getTime()) return 'Trước ngày bắt đầu challenge'
  if (time > new Date(challenge.endsAt).getTime()) return 'Sau ngày kết thúc challenge'

  const filter = challenge.filter
  if (filter.sport_types && !filter.sport_types.includes(activity.sportType)) return 'Không đúng môn được tính'
  if (filter.min_distance_m !== undefined && activity.distanceMeters < filter.min_distance_m) {
    return `Ngắn hơn ${filter.min_distance_m / METERS_PER_KM} km`
  }

  const pace = paceSecondsPerKm(activity)
  if (filter.max_pace_s_per_km !== undefined && (pace === null || pace > filter.max_pace_s_per_km)) {
    return `Chậm hơn ${formatPace(filter.max_pace_s_per_km)}`
  }
  if (filter.min_pace_s_per_km !== undefined && pace !== null && pace < filter.min_pace_s_per_km) {
    return `Nhanh hơn ${formatPace(filter.min_pace_s_per_km)} (nghi ngờ không hợp lệ)`
  }
  if (filter.time_window && !isInsideWindow(vietnamHour(activity.startDate), filter.time_window)) {
    return `Ngoài khung giờ ${filter.time_window.start_hour}:00 đến ${filter.time_window.end_hour}:00`
  }
  return null
}

function endOfActivity(activity: ScoringActivity): string {
  return new Date(new Date(activity.startDate).getTime() + activity.elapsedTimeSeconds * 1000).toISOString()
}

type ValueStep = {
  activity: ScoringActivity
  counted: number
  valueAfter: number
}

// Cắt phần vượt trần mỗi ngày (giờ VN), tính theo thứ tự thời gian
function applyDailyCap(
  activities: ScoringActivity[],
  cap: number | undefined,
): { activity: ScoringActivity; counted: number }[] {
  const usedByDay = new Map<string, number>()
  return activities.map((activity) => {
    if (cap === undefined) return { activity, counted: activity.distanceMeters }
    const day = vietnamDate(new Date(activity.startDate))
    const used = usedByDay.get(day) ?? 0
    const counted = Math.max(0, Math.min(activity.distanceMeters, cap - used))
    usedByDay.set(day, used + counted)
    return { activity, counted }
  })
}

function stepsForGoal(
  goalType: ScoringChallenge['goalType'],
  valid: ScoringActivity[],
  filter: ActivityFilter,
): ValueStep[] {
  if (goalType === 'single_distance') {
    let best = 0
    const steps = valid.map((activity) => {
      best = Math.max(best, activity.distanceMeters)
      return { activity, counted: activity.distanceMeters, valueAfter: best }
    })
    return steps
  }

  if (goalType === 'active_days') {
    const days = new Set<string>()
    const steps = valid.map((activity) => {
      const before = days.size
      days.add(vietnamDate(new Date(activity.startDate)))
      return {
        activity,
        counted: days.size > before ? 1 : 0,
        valueAfter: days.size,
      }
    })
    return steps
  }

  let total = 0
  const capped = applyDailyCap(valid, goalType === 'total_distance' ? filter.max_distance_per_day_m : undefined)
  const steps = capped.map(({ activity, counted }) => {
    const gained =
      goalType === 'total_distance' ? counted : goalType === 'total_elevation' ? activity.elevationGainMeters : 1
    total += gained
    return { activity, counted: gained, valueAfter: total }
  })
  return steps
}

export function scoreEntry(challenge: ScoringChallenge, goalValue: number, activities: ScoringActivity[]): ScoreResult {
  const sorted = [...activities].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const excluded: ExcludedActivity[] = []
  const valid: ScoringActivity[] = []
  for (const activity of sorted) {
    const reason = rejectionReason(activity, challenge)
    if (reason) excluded.push({ activityId: activity.id, reason })
    else valid.push(activity)
  }

  const steps = stepsForGoal(challenge.goalType, valid, challenge.filter)
  const value = steps[steps.length - 1]?.valueAfter ?? 0
  const reachedAt = steps.find((step) => step.valueAfter >= goalValue)
  const counted: CountedActivity[] = steps
    .filter((step) => step.counted > 0)
    .map((step) => ({
      activityId: step.activity.id,
      countedValue: step.counted,
    }))
  for (const step of steps) {
    if (step.counted === 0)
      excluded.push({
        activityId: step.activity.id,
        reason: reasonForZeroCount(challenge),
      })
  }

  const lastStep = steps[steps.length - 1]
  return {
    value,
    progressPct: goalValue > 0 ? (value / goalValue) * 100 : 0,
    completed: reachedAt !== undefined,
    completedAt: reachedAt ? endOfActivity(reachedAt.activity) : null,
    lastActivityAt: lastStep ? lastStep.activity.startDate : null,
    counted,
    excluded,
  }
}

function reasonForZeroCount(challenge: ScoringChallenge): string {
  if (challenge.goalType === 'active_days') return 'Cùng ngày với buổi đã tính'
  if (challenge.goalType === 'total_distance') return 'Vượt giới hạn km mỗi ngày'
  return 'Không đóng góp vào chỉ tiêu'
}
