import 'server-only'
import { EVENT_LIST_LIMIT } from '@/config/events'
import { toEventView, type EventView } from '@/lib/events/loadEvents'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AttendanceStatus } from '@/lib/types/database'

const ATTENDEE_LIST_LIMIT = 1000

export type AdminEventRow = EventView & { goingCount: number }

export type AdminAttendee = {
  memberId: string
  displayName: string | null
  status: AttendanceStatus
  checkedInAt: string | null
  hasActivity: boolean
}

export async function loadAdminEvents(): Promise<AdminEventRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('events').select('*').order('starts_at', { ascending: false }).limit(EVENT_LIST_LIMIT)
  const views = (data ?? []).map(toEventView)
  const { data: counts } = await supabase
    .from('event_counts')
    .select('event_id, going_count')
    .in('event_id', views.map((view) => view.id))
  const goingById = new Map((counts ?? []).map((row) => [row.event_id, row.going_count ?? 0]))
  return views.map((view) => ({ ...view, goingCount: goingById.get(view.id) ?? 0 }))
}

export async function loadAdminEvent(eventId: string): Promise<EventView | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
  return data ? toEventView(data) : null
}

export async function loadAdminAttendees(eventId: string): Promise<AdminAttendee[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('event_attendees')
    .select('member_id, status, checked_in_at, activity_id, members!event_attendees_member_id_fkey(display_name)')
    .eq('event_id', eventId)
    .order('status_changed_at')
    .limit(ATTENDEE_LIST_LIMIT)
  return (data ?? []).map((row) => ({
    memberId: row.member_id,
    displayName: row.members?.display_name ?? null,
    status: row.status,
    checkedInAt: row.checked_in_at,
    hasActivity: row.activity_id !== null,
  }))
}
