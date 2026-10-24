export function buildCheckinLink(origin: string, eventId: string, code: string): string {
  return `${origin.replace(/\/$/, '')}/events/${eventId}/checkin?code=${encodeURIComponent(code)}`
}
