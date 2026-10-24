import type { StravaActivityJson } from '@/lib/strava/mapActivity'

export type StravaEvent = {
  object_type: string
  object_id: number
  aspect_type: string
  owner_id: number
  updates: unknown
}

export type EventProcessorDeps = {
  findMemberIdByAthleteId: (athleteId: number) => Promise<string | null>
  fetchActivity: (memberId: string, activityId: number) => Promise<StravaActivityJson>
  saveActivity: (memberId: string, activity: StravaActivityJson) => Promise<void>
  deleteActivity: (memberId: string, activityId: number) => Promise<void>
  disconnectMember: (memberId: string) => Promise<void>
}

export type EventOutcome = 'processed' | 'ignored'

function isDeauthorization(event: StravaEvent): boolean {
  if (event.object_type !== 'athlete' || event.aspect_type !== 'update') return false
  const updates = event.updates as Record<string, unknown> | null
  return updates?.authorized === 'false' || updates?.authorized === false
}

async function processActivityEvent(
  deps: EventProcessorDeps,
  event: StravaEvent,
  memberId: string,
): Promise<EventOutcome> {
  if (event.aspect_type === 'delete') {
    await deps.deleteActivity(memberId, event.object_id)
    return 'processed'
  }
  const activity = await deps.fetchActivity(memberId, event.object_id)
  await deps.saveActivity(memberId, activity)
  return 'processed'
}

export async function processStravaEvent(deps: EventProcessorDeps, event: StravaEvent): Promise<EventOutcome> {
  const memberId = await deps.findMemberIdByAthleteId(event.owner_id)
  if (!memberId) return 'ignored'

  if (isDeauthorization(event)) {
    await deps.disconnectMember(memberId)
    return 'processed'
  }
  if (event.object_type === 'activity') return processActivityEvent(deps, event, memberId)
  return 'ignored'
}
