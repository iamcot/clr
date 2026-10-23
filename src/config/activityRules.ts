export type ActivityRules = {
  allowedSportTypes: readonly string[]
  allowManual: boolean
  fastestPaceSecondsPerKm: number
}

export const ACTIVITY_RULES: ActivityRules = {
  allowedSportTypes: ['Run', 'TrailRun', 'VirtualRun'],
  allowManual: false,
  fastestPaceSecondsPerKm: 170,
}

// Các môn có best efforts trong chi tiết hoạt động
export const BEST_EFFORT_SPORT_TYPES: readonly string[] = ['Run', 'TrailRun', 'VirtualRun']
