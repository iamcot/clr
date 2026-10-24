export type SummaryActivity = { startDateLocal: string; distanceMeters: number; movingTimeSeconds: number }

export type ActivitySummary = { distanceMeters: number; sessions: number; movingTimeSeconds: number }

function sumUp(activities: SummaryActivity[]): ActivitySummary {
  return activities.reduce(
    (total, activity) => ({
      distanceMeters: total.distanceMeters + activity.distanceMeters,
      sessions: total.sessions + 1,
      movingTimeSeconds: total.movingTimeSeconds + activity.movingTimeSeconds,
    }),
    { distanceMeters: 0, sessions: 0, movingTimeSeconds: 0 },
  )
}

// `todayLocal` là ngày giờ địa phương dạng ISO ('2026-10-24...'); so khớp theo tiền tố tháng/năm
export function summarizeMonthAndYear(activities: SummaryActivity[], todayLocal: string) {
  const year = todayLocal.slice(0, 4)
  const month = todayLocal.slice(0, 7)
  return {
    month: sumUp(activities.filter((activity) => activity.startDateLocal.startsWith(month))),
    year: sumUp(activities.filter((activity) => activity.startDateLocal.startsWith(year))),
  }
}
