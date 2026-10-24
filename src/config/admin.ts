export const ADMIN_PAGE_SIZE = 30

export type ActivitySportGroup = 'run' | 'ride' | 'swim' | 'other'

export const ACTIVITY_SPORT_GROUP_LABELS: Record<ActivitySportGroup, string> = {
  run: 'Chạy',
  ride: 'Đạp xe',
  swim: 'Bơi',
  other: 'Khác',
}

// Nhóm "other" là mọi loại không nằm trong ba nhóm còn lại
export const ACTIVITY_SPORT_TYPES: Record<Exclude<ActivitySportGroup, 'other'>, readonly string[]> = {
  run: ['Run', 'TrailRun', 'VirtualRun'],
  ride: ['Ride', 'VirtualRide', 'EBikeRide', 'MountainBikeRide', 'EMountainBikeRide', 'GravelRide', 'Handcycle', 'Velomobile'],
  swim: ['Swim'],
}

export const ACTIVITY_SPORT_GROUPS = Object.keys(ACTIVITY_SPORT_GROUP_LABELS) as ActivitySportGroup[]
