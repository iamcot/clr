import { EVENT_QUEUE } from '@/config/strava'
import type { EventOutcome, StravaEvent } from '@/lib/strava/eventProcessor'
import { RateLimitedError } from '@/lib/strava/errors'

export type QueuedEvent = StravaEvent & { id: number; attempts: number }

export type EventQueueDeps = {
  claimDueEvents: (limit: number) => Promise<QueuedEvent[]>
  markProcessed: (eventId: number) => Promise<void>
  markFailed: (eventId: number, failure: { attempts: number; error: string; retryAt: Date }) => Promise<void>
  releaseEvent: (eventId: number, retryAt: Date) => Promise<void>
  process: (event: QueuedEvent) => Promise<EventOutcome>
  canSpend: () => Promise<boolean>
  now: () => Date
}

export function retryDelaySeconds(attempts: number): number {
  return EVENT_QUEUE.baseRetryDelaySeconds * 2 ** Math.max(attempts - 1, 0)
}

async function handleFailure(deps: EventQueueDeps, event: QueuedEvent, error: unknown) {
  const attempts = event.attempts + 1
  const message = error instanceof Error ? error.message : String(error)
  const retryAt = new Date(deps.now().getTime() + retryDelaySeconds(attempts) * 1000)
  await deps.markFailed(event.id, { attempts, error: message.slice(0, 500), retryAt })
}

// Trả về số event đã xử lý xong
export async function runEventQueue(deps: EventQueueDeps): Promise<number> {
  const events = await deps.claimDueEvents(EVENT_QUEUE.batchSize)
  let processed = 0

  for (const event of events) {
    if (!(await deps.canSpend())) {
      await deps.releaseEvent(event.id, deps.now())
      continue
    }
    try {
      await deps.process(event)
      await deps.markProcessed(event.id)
      processed += 1
    } catch (error) {
      if (error instanceof RateLimitedError) await deps.releaseEvent(event.id, error.retryAt)
      else await handleFailure(deps, event, error)
    }
  }
  return processed
}
