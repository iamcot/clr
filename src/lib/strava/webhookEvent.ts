import type { Database } from '@/lib/types/database'

type EventInsert = Database['public']['Tables']['strava_events']['Insert']

export function parseWebhookEvent(body: unknown): EventInsert | null {
  if (typeof body !== 'object' || body === null) return null
  const { object_type, object_id, aspect_type, owner_id, event_time, updates } = body as Record<string, unknown>
  if (typeof object_type !== 'string' || typeof aspect_type !== 'string') return null
  if (typeof object_id !== 'number' || typeof owner_id !== 'number' || typeof event_time !== 'number') return null

  return {
    object_type,
    object_id,
    aspect_type,
    owner_id,
    event_time: new Date(event_time * 1000).toISOString(),
    updates: (updates ?? null) as EventInsert['updates'],
  }
}
