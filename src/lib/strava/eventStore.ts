import 'server-only'
import type { EventQueueDeps, QueuedEvent } from '@/lib/strava/eventQueue'
import { EVENT_QUEUE } from '@/config/strava'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/lib/types/database'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>
type EventInsert = Database['public']['Tables']['strava_events']['Insert']

const CLAIM_LEASE_MINUTES = 5

export async function recordStravaEvent(db: ServiceClient, event: EventInsert) {
  const { error } = await db
    .from('strava_events')
    .upsert(event, { onConflict: 'object_type,object_id,aspect_type,owner_id,event_time', ignoreDuplicates: true })
  if (error) throw new Error(`Không ghi được event Strava: ${error.message}`)
}

function toQueuedEvent(row: Database['public']['Tables']['strava_events']['Row']): QueuedEvent {
  return {
    id: row.id,
    attempts: row.attempts,
    object_type: row.object_type,
    object_id: row.object_id,
    aspect_type: row.aspect_type,
    owner_id: row.owner_id,
    updates: row.updates,
  }
}

async function updateEvent(
  db: ServiceClient,
  eventId: number,
  patch: Database['public']['Tables']['strava_events']['Update'],
) {
  const { error } = await db.from('strava_events').update(patch).eq('id', eventId)
  if (error) throw new Error(`Không cập nhật được event ${eventId}: ${error.message}`)
}

type EventStoreDeps = Pick<EventQueueDeps, 'claimDueEvents' | 'markProcessed' | 'markFailed' | 'releaseEvent'>

export function createSupabaseEventStore(db: ServiceClient): EventStoreDeps {
  return {
    // Mượn event bằng cách đẩy next_attempt_at lên; chỉ tiến trình cập nhật được dòng mới được xử lý
    async claimDueEvents(limit) {
      const now = new Date()
      const { data, error } = await db
        .from('strava_events')
        .select('*')
        .is('processed_at', null)
        .lt('attempts', EVENT_QUEUE.maxAttempts)
        .lte('next_attempt_at', now.toISOString())
        .order('next_attempt_at')
        .limit(limit)
      if (error) throw new Error(`Không đọc được hàng đợi event: ${error.message}`)

      const lease = new Date(now.getTime() + CLAIM_LEASE_MINUTES * 60 * 1000).toISOString()
      const claimed: QueuedEvent[] = []
      for (const row of data) {
        const { data: won, error: claimError } = await db
          .from('strava_events')
          .update({ next_attempt_at: lease })
          .eq('id', row.id)
          .eq('next_attempt_at', row.next_attempt_at)
          .select('id')
        if (claimError) throw new Error(`Không mượn được event: ${claimError.message}`)
        if (won.length > 0) claimed.push(toQueuedEvent(row))
      }
      return claimed
    },

    markProcessed: (eventId) => updateEvent(db, eventId, { processed_at: new Date().toISOString(), error: null }),

    markFailed: (eventId, failure) =>
      updateEvent(db, eventId, {
        attempts: failure.attempts,
        error: failure.error,
        next_attempt_at: failure.retryAt.toISOString(),
      }),

    releaseEvent: (eventId, retryAt) => updateEvent(db, eventId, { next_attempt_at: retryAt.toISOString() }),
  }
}
