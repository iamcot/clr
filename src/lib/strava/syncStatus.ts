import 'server-only'
import { describeBackfillStatus } from '@/lib/strava/backfillStatus'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getBackfillStatusText(memberId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const [job, activities] = await Promise.all([
    supabase.from('backfill_jobs').select('status, cursor_before').eq('member_id', memberId).maybeSingle(),
    supabase.from('activities').select('id', { count: 'exact', head: true }).eq('member_id', memberId),
  ])
  if (!job.data) return null

  return describeBackfillStatus({
    status: job.data.status,
    activityCount: activities.count ?? 0,
    cursorBefore: job.data.cursor_before,
  })
}
