import { BACKFILL } from '@/config/strava'
import { RateLimitedError, StravaNotConnectedError } from '@/lib/strava/errors'
import type { ListActivitiesParams } from '@/lib/strava/client'
import type { StravaActivityJson } from '@/lib/strava/mapActivity'

export type BackfillJob = {
  memberId: string
  fromDate: string
  cursorBefore: string | null
}

export type JobPatch = {
  cursorBefore?: string
  pagesDone?: number
  status?: 'done' | 'failed'
  error?: string | null
}

export type BackfillDeps = {
  listPendingJobs: (limit: number) => Promise<(BackfillJob & { pagesDone: number })[]>
  fetchPage: (memberId: string, params: ListActivitiesParams) => Promise<StravaActivityJson[]>
  saveSummaries: (memberId: string, activities: StravaActivityJson[]) => Promise<void>
  updateJob: (memberId: string, patch: JobPatch) => Promise<void>
  canSpend: () => Promise<boolean>
  now: () => Date
}

// Kéo từ 01/01 năm trước tới nay
export function backfillStartDate(now: Date): string {
  const year = BACKFILL.startFromPreviousYear ? now.getUTCFullYear() - 1 : now.getUTCFullYear()
  return `${year}-01-01`
}

function oldestStartDate(activities: StravaActivityJson[]): Date | null {
  const times = activities
    .map((activity) => (typeof activity.start_date === 'string' ? Date.parse(activity.start_date) : NaN))
    .filter((time) => !Number.isNaN(time))
  return times.length > 0 ? new Date(Math.min(...times)) : null
}

async function runPage(deps: BackfillDeps, job: BackfillJob & { pagesDone: number }) {
  const page = await deps.fetchPage(job.memberId, {
    after: new Date(`${job.fromDate}T00:00:00Z`),
    before: job.cursorBefore ? new Date(job.cursorBefore) : deps.now(),
    page: 1,
    perPage: BACKFILL.pageSize,
  })
  await deps.saveSummaries(job.memberId, page)

  const oldest = oldestStartDate(page)
  const finished = page.length < BACKFILL.pageSize || oldest === null
  await deps.updateJob(job.memberId, {
    pagesDone: job.pagesDone + 1,
    error: null,
    ...(oldest ? { cursorBefore: oldest.toISOString() } : {}),
    ...(finished ? { status: 'done' as const } : {}),
  })
}

async function failJob(deps: BackfillDeps, memberId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const status = error instanceof StravaNotConnectedError ? { status: 'failed' as const } : {}
  await deps.updateJob(memberId, { error: message.slice(0, 500), ...status })
}

// Mỗi job một trang mỗi lần chạy để các thành viên được kéo đều tay; dừng khi hết hạn mức
export async function runBackfill(deps: BackfillDeps): Promise<number> {
  const jobs = await deps.listPendingJobs(BACKFILL.jobsPerRun)
  let pagesFetched = 0

  for (const job of jobs) {
    if (!(await deps.canSpend())) break
    try {
      await runPage(deps, job)
      pagesFetched += 1
    } catch (error) {
      if (error instanceof RateLimitedError) break
      await failJob(deps, job.memberId, error)
    }
  }
  return pagesFetched
}
