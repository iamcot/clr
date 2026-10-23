import { RateLimitedError, StravaApiError } from '@/lib/strava/errors'

export type DetailBackfillDeps = {
  listActivitiesWithoutDetail: (limit: number) => Promise<{ id: number; memberId: string }[]>
  fetchAndSaveDetail: (memberId: string, activityId: number) => Promise<void>
  deleteMissingActivity: (memberId: string, activityId: number) => Promise<void>
  canSpend: () => Promise<boolean>
}

// Lấy best efforts cho hoạt động chạy mới nhất trước, chỉ khi còn dư hạn mức
export async function runDetailBackfill(deps: DetailBackfillDeps, limit: number): Promise<number> {
  const pending = await deps.listActivitiesWithoutDetail(limit)
  let fetched = 0

  for (const activity of pending) {
    if (!(await deps.canSpend())) break
    try {
      await deps.fetchAndSaveDetail(activity.memberId, activity.id)
      fetched += 1
    } catch (error) {
      if (error instanceof RateLimitedError) break
      if (error instanceof StravaApiError && error.status === 404) {
        await deps.deleteMissingActivity(activity.memberId, activity.id)
        continue
      }
      console.error(`Không lấy được chi tiết hoạt động ${activity.id}`, error)
    }
  }
  return fetched
}
