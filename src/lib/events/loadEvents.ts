import 'server-only'
import { EVENT_LIST_LIMIT, EVENT_PARTICIPANT_PREVIEW } from '@/config/events'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database, AttendanceStatus, EventKind, EventStatus } from '@/lib/types/database'

type EventRow = Database['public']['Tables']['events']['Row']

export type EventView = {
  id: string
  title: string
  kind: EventKind
  descriptionMd: string
  coverUrl: string | null
  locationName: string
  locationLat: number | null
  locationLng: number | null
  startsAt: string
  endsAt: string
  registrationClosesAt: string | null
  capacity: number | null
  fee: number | null
  routeDistanceM: number | null
  status: EventStatus
  absentPenalty: boolean
}

export type EventCounts = { going: number; maybe: number; waitlist: number; photos: number }

export type EventCard = EventView & { counts: EventCounts; myStatus: AttendanceStatus | null }

export type Participant = { memberId: string; displayName: string | null; avatarUrl: string | null }

export type EventDetail = EventCard & { goingParticipants: Participant[]; maybeCount: number }

export function toEventView(row: EventRow): EventView {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    descriptionMd: row.description_md,
    coverUrl: row.cover_url,
    locationName: row.location_name,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationClosesAt: row.registration_closes_at,
    capacity: row.capacity,
    fee: row.fee === null ? null : Number(row.fee),
    routeDistanceM: row.route_distance_m,
    status: row.status,
    absentPenalty: row.absent_penalty,
  }
}

const EMPTY_COUNTS: EventCounts = { going: 0, maybe: 0, waitlist: 0, photos: 0 }

async function loadCounts(eventIds: string[]): Promise<Map<string, EventCounts>> {
  if (eventIds.length === 0) return new Map()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('event_counts').select('*').in('event_id', eventIds)
  return new Map(
    (data ?? []).flatMap((row) =>
      row.event_id
        ? [
            [
              row.event_id,
              {
                going: row.going_count ?? 0,
                maybe: row.maybe_count ?? 0,
                waitlist: row.waitlist_count ?? 0,
                photos: row.photo_count ?? 0,
              },
            ] as const,
          ]
        : [],
    ),
  )
}

async function loadMyStatuses(memberId: string, eventIds: string[]): Promise<Map<string, AttendanceStatus>> {
  if (eventIds.length === 0) return new Map()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('event_attendees')
    .select('event_id, status')
    .eq('member_id', memberId)
    .in('event_id', eventIds)
  return new Map((data ?? []).map((row) => [row.event_id, row.status]))
}

export async function loadEventCards(memberId: string): Promise<EventCard[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .neq('status', 'draft')
    .order('starts_at', { ascending: false })
    .limit(EVENT_LIST_LIMIT)
  const views = (data ?? []).map(toEventView)
  const ids = views.map((view) => view.id)
  const [counts, statuses] = await Promise.all([loadCounts(ids), loadMyStatuses(memberId, ids)])
  return views.map((view) => ({
    ...view,
    counts: counts.get(view.id) ?? EMPTY_COUNTS,
    myStatus: statuses.get(view.id) ?? null,
  }))
}

async function loadGoingParticipants(eventId: string): Promise<Participant[]> {
  const supabase = await createSupabaseServerClient()
  const { data: attendees } = await supabase
    .from('event_attendees')
    .select('member_id')
    .eq('event_id', eventId)
    .eq('status', 'going')
    .order('status_changed_at')
    .limit(EVENT_PARTICIPANT_PREVIEW)
  const ids = (attendees ?? []).map((row) => row.member_id)
  if (ids.length === 0) return []
  const { data: members } = await supabase.from('members_public').select('id, display_name, avatar_url').in('id', ids)
  const byId = new Map((members ?? []).map((member) => [member.id, member]))
  return ids.flatMap((id) => {
    const member = byId.get(id)
    return member ? [{ memberId: id, displayName: member.display_name, avatarUrl: member.avatar_url }] : []
  })
}

export async function loadEventDetail(eventId: string, memberId: string): Promise<EventDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('events').select('*').eq('id', eventId).neq('status', 'draft').maybeSingle()
  if (!data) return null
  const view = toEventView(data)
  const [counts, statuses, goingParticipants] = await Promise.all([
    loadCounts([eventId]),
    loadMyStatuses(memberId, [eventId]),
    loadGoingParticipants(eventId),
  ])
  const eventCounts = counts.get(eventId) ?? EMPTY_COUNTS
  return {
    ...view,
    counts: eventCounts,
    myStatus: statuses.get(eventId) ?? null,
    goingParticipants,
    maybeCount: eventCounts.maybe,
  }
}

export type EventRunSummary = {
  attendedCount: number
  runnerCount: number
  totalDistanceM: number
  totalMovingTimeS: number
}

export async function loadEventRunSummary(eventId: string): Promise<EventRunSummary | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('event_run_summary', { p_event_id: eventId })
  const row = data?.[0]
  if (!row) return null
  return {
    attendedCount: row.attended_count,
    runnerCount: row.runner_count,
    totalDistanceM: Number(row.total_distance_m),
    totalMovingTimeS: Number(row.total_moving_time_s),
  }
}
