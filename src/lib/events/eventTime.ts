import type { EventStatus } from '@/lib/types/database'

type EventWindow = { startsAt: string; endsAt: string; status: EventStatus; registrationClosesAt: string | null }

export function registrationDeadline(event: Pick<EventWindow, 'startsAt' | 'registrationClosesAt'>): string {
  return event.registrationClosesAt ?? event.startsAt
}

export function isRegistrationOpen(event: EventWindow, now: Date): boolean {
  if (event.status !== 'published') return false
  return now.getTime() < Date.parse(registrationDeadline(event))
}

// Event đã xong khi BCN đánh dấu, hoặc đã công bố mà quá giờ kết thúc
export function isPastEvent(event: Pick<EventWindow, 'endsAt' | 'status'>, now: Date): boolean {
  if (event.status === 'done') return true
  return event.status === 'published' && Date.parse(event.endsAt) <= now.getTime()
}

export function splitUpcomingAndPast<Event extends EventWindow>(
  events: Event[],
  now: Date,
): { upcoming: Event[]; past: Event[] } {
  const upcoming = events.filter((event) => !isPastEvent(event, now))
  const past = events.filter((event) => isPastEvent(event, now))
  return {
    upcoming: upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    past: past.sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
  }
}

export function isCheckinOpen(
  event: Pick<EventWindow, 'startsAt' | 'endsAt' | 'status'>,
  now: Date,
  opensBeforeMs: number,
  closesAfterMs: number,
): boolean {
  if (event.status !== 'published') return false
  const time = now.getTime()
  return time >= Date.parse(event.startsAt) - opensBeforeMs && time <= Date.parse(event.endsAt) + closesAfterMs
}
