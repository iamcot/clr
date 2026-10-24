import 'server-only'
import { EVENT_TOP_ATTENDEES_LIMIT } from '@/config/events'
import type { EventStatsRow } from '@/lib/events/eventStats'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type TopAttendee = { memberId: string; displayName: string | null; eventCount: number }

export async function loadEventStatsRows(from: string, to: string): Promise<EventStatsRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('admin_event_stats', { p_from: from, p_to: to })
  return (data ?? []).map((row) => ({
    eventId: row.event_id,
    title: row.title,
    startsAt: row.starts_at,
    registeredCount: row.registered_count,
    attendedCount: row.attended_count,
    totalDistanceM: Number(row.total_distance_m),
  }))
}

export async function loadTopAttendees(from: string, to: string): Promise<TopAttendee[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('admin_event_top_attendees', {
    p_from: from,
    p_to: to,
    p_limit: EVENT_TOP_ATTENDEES_LIMIT,
  })
  return (data ?? []).map((row) => ({ memberId: row.member_id, displayName: row.display_name, eventCount: row.event_count }))
}
