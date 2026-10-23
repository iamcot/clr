import 'server-only'
import { BACKFILL } from '@/config/strava'
import { BEST_EFFORT_SPORT_TYPES } from '@/config/activityRules'
import { deleteActivity, saveActivityDetail, saveActivitySummaries } from '@/lib/strava/activitySaver'
import { backfillStartDate, runBackfill, type JobPatch } from '@/lib/strava/backfill'
import { runDetailBackfill } from '@/lib/strava/detailBackfill'
import { canSpendStravaRequest, getServerStravaClient } from '@/lib/strava/serverClient'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

const CANDIDATE_JOBS = 100

// Thành viên đang hoạt động và đã kết nối mà chưa có job thì tạo job (kể cả vừa được BCN duyệt)
async function createMissingJobs(db: ServiceClient) {
  const { data: members, error } = await db
    .from('members')
    .select('id')
    .eq('status', 'active')
    .eq('strava_connected', true)
  if (error) throw new Error(`Không đọc được thành viên: ${error.message}`)
  const { data: jobs, error: jobError } = await db.from('backfill_jobs').select('member_id')
  if (jobError) throw new Error(`Không đọc được job kéo lịch sử: ${jobError.message}`)

  const hasJob = new Set(jobs.map((job) => job.member_id))
  const fromDate = backfillStartDate(new Date())
  const missing = members
    .filter((member) => !hasJob.has(member.id))
    .map((member) => ({ member_id: member.id, from_date: fromDate }))
  if (missing.length === 0) return

  const { error: insertError } = await db
    .from('backfill_jobs')
    .upsert(missing, { onConflict: 'member_id', ignoreDuplicates: true })
  if (insertError) throw new Error(`Không tạo được job kéo lịch sử: ${insertError.message}`)
}

async function listPendingJobs(db: ServiceClient, limit: number) {
  const { data: jobs, error } = await db
    .from('backfill_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('last_run_at', { ascending: true, nullsFirst: true })
    .limit(CANDIDATE_JOBS)
  if (error) throw new Error(`Không đọc được job kéo lịch sử: ${error.message}`)
  if (jobs.length === 0) return []

  const { data: members, error: memberError } = await db
    .from('members')
    .select('id')
    .in(
      'id',
      jobs.map((job) => job.member_id),
    )
    .eq('status', 'active')
    .eq('strava_connected', true)
  if (memberError) throw new Error(`Không đọc được thành viên: ${memberError.message}`)

  const eligible = new Set(members.map((member) => member.id))
  return jobs
    .filter((job) => eligible.has(job.member_id))
    .slice(0, limit)
    .map((job) => ({
      memberId: job.member_id,
      fromDate: job.from_date,
      cursorBefore: job.cursor_before,
      pagesDone: job.pages_done,
    }))
}

async function updateJob(db: ServiceClient, memberId: string, patch: JobPatch) {
  const { error } = await db
    .from('backfill_jobs')
    .update({
      last_run_at: new Date().toISOString(),
      ...(patch.cursorBefore !== undefined && { cursor_before: patch.cursorBefore }),
      ...(patch.pagesDone !== undefined && { pages_done: patch.pagesDone }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.error !== undefined && { error: patch.error }),
    })
    .eq('member_id', memberId)
  if (error) throw new Error(`Không cập nhật được job kéo lịch sử: ${error.message}`)
}

async function listActivitiesWithoutDetail(db: ServiceClient, limit: number) {
  const { data, error } = await db
    .from('activities')
    .select('id, member_id')
    .eq('detail_fetched', false)
    .in('sport_type', [...BEST_EFFORT_SPORT_TYPES])
    .order('start_date', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Không đọc được hoạt động thiếu chi tiết: ${error.message}`)
  return data.map((row) => ({ id: row.id, memberId: row.member_id }))
}

export async function runBackfillJob() {
  const db = createSupabaseServiceClient()
  const client = getServerStravaClient()
  const canSpend = () => canSpendStravaRequest('background')

  await createMissingJobs(db)

  const pages = await runBackfill({
    listPendingJobs: (limit) => listPendingJobs(db, limit),
    fetchPage: client.listActivities,
    saveSummaries: (memberId, activities) => saveActivitySummaries(db, memberId, activities),
    updateJob: (memberId, patch) => updateJob(db, memberId, patch),
    canSpend,
    now: () => new Date(),
  })

  const details = await runDetailBackfill(
    {
      listActivitiesWithoutDetail: (limit) => listActivitiesWithoutDetail(db, limit),
      fetchAndSaveDetail: async (memberId, activityId) =>
        saveActivityDetail(db, memberId, await client.getActivity(memberId, activityId)),
      deleteMissingActivity: (memberId, activityId) => deleteActivity(db, memberId, activityId),
      canSpend,
    },
    BACKFILL.detailsPerRun,
  )
  return { pages, details }
}
