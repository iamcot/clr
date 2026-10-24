import { RACE_ACTIVITY_DISTANCE_TOLERANCE } from '@/config/prDistances'

export type CandidateActivity = { id: number; startDateLocal: string; distanceMeters: number }

// Hoạt động cùng ngày, cự ly lệch không quá ngưỡng cho phép; ưu tiên cái gần cự ly giải nhất
export function suggestRaceActivity(
  raceDate: string,
  raceDistanceMeters: number,
  activities: CandidateActivity[],
  tolerance: number = RACE_ACTIVITY_DISTANCE_TOLERANCE,
): CandidateActivity | null {
  const closeEnough = activities
    .filter((activity) => activity.startDateLocal.startsWith(raceDate))
    .filter((activity) => Math.abs(activity.distanceMeters - raceDistanceMeters) <= raceDistanceMeters * tolerance)
    .sort(
      (a, b) =>
        Math.abs(a.distanceMeters - raceDistanceMeters) - Math.abs(b.distanceMeters - raceDistanceMeters),
    )
  return closeEnough[0] ?? null
}
