import { EVENT_ICS_PRODUCT_ID } from '@/config/events'

export type IcsEvent = {
  id: string
  title: string
  description: string
  locationName: string
  startsAt: string
  endsAt: string
  url: string
}

function formatUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

export function buildIcs(event: IcsEvent, generatedAt: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${EVENT_ICS_PRODUCT_ID}`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@clr`,
    `DTSTAMP:${formatUtc(generatedAt.toISOString())}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(event.endsAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.locationName)}`,
    `URL:${event.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.join('\r\n')}\r\n`
}
