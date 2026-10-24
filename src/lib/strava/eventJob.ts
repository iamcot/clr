import 'server-only'
import { deleteActivity, saveActivityDetail } from '@/lib/strava/activitySaver'
import { runEventQueue } from '@/lib/strava/eventQueue'
import { createSupabaseEventStore } from '@/lib/strava/eventStore'
import { processStravaEvent } from '@/lib/strava/eventProcessor'
import { disconnectLocally } from '@/lib/strava/localData'
import { canSpendStravaRequest, getServerStravaClient } from '@/lib/strava/serverClient'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

async function findMemberIdByAthleteId(db: ReturnType<typeof createSupabaseServiceClient>, athleteId: number) {
  const { data, error } = await db.from('members').select('id').eq('strava_athlete_id', athleteId).maybeSingle()
  if (error) throw new Error(`Không tìm được thành viên: ${error.message}`)
  return data?.id ?? null
}

export async function runStravaEventJob(): Promise<number> {
  const db = createSupabaseServiceClient()
  const client = getServerStravaClient()

  return runEventQueue({
    ...createSupabaseEventStore(db),
    process: (event) =>
      processStravaEvent(
        {
          findMemberIdByAthleteId: (athleteId) => findMemberIdByAthleteId(db, athleteId),
          fetchActivity: client.getActivity,
          saveActivity: (memberId, activity) => saveActivityDetail(db, memberId, activity),
          deleteActivity: (memberId, activityId) => deleteActivity(db, memberId, activityId),
          disconnectMember: (memberId) => disconnectLocally(db, memberId),
        },
        event,
      ),
    canSpend: () => canSpendStravaRequest('webhook'),
    now: () => new Date(),
  })
}
