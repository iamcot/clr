export type PrDistance = {
  name: string
  label: string
  distanceMeters: number
}

// `name` khớp tên best effort của Strava (so sánh không phân biệt hoa thường)
export const PR_DISTANCES: readonly PrDistance[] = [
  { name: '1k', label: '1K', distanceMeters: 1000 },
  { name: '5k', label: '5K', distanceMeters: 5000 },
  { name: '10k', label: '10K', distanceMeters: 10000 },
  { name: 'half-marathon', label: 'Half-Marathon', distanceMeters: 21097 },
  { name: 'marathon', label: 'Marathon', distanceMeters: 42195 },
]

export const RACE_ACTIVITY_DISTANCE_TOLERANCE = 0.1
export const RECENT_ACTIVITIES_LIMIT = 20
export const RECENT_RACES_ON_PROFILE = 3
