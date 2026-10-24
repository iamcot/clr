import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ACTIVITY_MATCH_LOOKBACK_MS, ACTIVITY_MATCH_RADIUS_M, ACTIVITY_MATCH_WINDOW_MS } from '@/config/events'
import { matchEventActivities, type MatchableActivity, type MatchableEvent } from '@/lib/events/matchActivity'
import type { Database } from '@/lib/types/database'

type ServiceClient = SupabaseClient<Database>
type EventRow = Database['public']['Tables']['events']['Row']

function toMatchableEvent(event: EventRow): MatchableEvent {
  const hasPoint = event.location_lat !== null && event.location_lng !== null
  return {
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    point: hasPoint ? { lat: event.location_lat ?? 0, lng: event.location_lng ?? 0 } : null,
  }
}

async function loadUnlinkedAttendeeIds(client: ServiceClient, eventId: string): Promise<string[]> {
  const { data } = await client
    .from('event_attendees')
    .select('member_id')
    .eq('event_id', eventId)
    .in('status', ['going', 'maybe'])
    .is('activity_id', null)
  return (data ?? []).map((row) => row.member_id)
}

async function loadCandidateActivities(
  client: ServiceClient,
  event: EventRow,
  memberIds: string[],
): Promise<MatchableActivity[]> {
  const from = new Date(Date.parse(event.starts_at) - ACTIVITY_MATCH_WINDOW_MS).toISOString()
  const to = new Date(Date.parse(event.ends_at) + ACTIVITY_MATCH_WINDOW_MS).toISOString()
  const { data } = await client
    .from('activities')
    .select('id, member_id, start_date, distance_m, start_latlng, private, counts_for_club, members!inner(share_private_in_totals)')
    .in('member_id', memberIds)
    .gte('start_date', from)
    .lte('start_date', to)
    .eq('counts_for_club', true)
  return (data ?? []).map((row) => ({
    activityId: row.id,
    memberId: row.member_id,
    startDate: row.start_date,
    distanceMeters: row.distance_m,
    startPoint: row.start_latlng,
    isPrivate: row.private,
    privateCountsInTotals: row.members.share_private_in_totals,
  }))
}

// Trả số người vừa được gắn hoạt động
export async function linkEventActivities(client: ServiceClient, event: EventRow): Promise<number> {
  const point = toMatchableEvent(event)
  if (!point.point) return 0
  const memberIds = await loadUnlinkedAttendeeIds(client, event.id)
  if (memberIds.length === 0) return 0

  const activities = await loadCandidateActivities(client, event, memberIds)
  const matches = matchEventActivities(point, activities, {
    windowMs: ACTIVITY_MATCH_WINDOW_MS,
    radiusMeters: ACTIVITY_MATCH_RADIUS_M,
  })
  for (const [memberId, activityId] of matches) {
    await client
      .from('event_attendees')
      .update({ activity_id: activityId })
      .eq('event_id', event.id)
      .eq('member_id', memberId)
  }
  return matches.size
}

export async function linkRecentEventActivities(client: ServiceClient, now: Date): Promise<number> {
  const { data } = await client
    .from('events')
    .select('*')
    .in('status', ['published', 'done'])
    .lte('starts_at', now.toISOString())
    .gte('ends_at', new Date(now.getTime() - ACTIVITY_MATCH_LOOKBACK_MS).toISOString())
  let linked = 0
  for (const event of data ?? []) linked += await linkEventActivities(client, event)
  return linked
}
