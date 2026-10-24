import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/env'
import { buildIcs } from '@/lib/events/ics'
import { loadEventDetail } from '@/lib/events/loadEvents'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await loadEventDetail(id, null)
  if (!event) return new NextResponse('Not found', { status: 404 })

  const body = buildIcs(
    {
      id: event.id,
      title: event.title,
      description: event.descriptionMd,
      locationName: event.locationName,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      url: `${getAppUrl()}/events/${event.id}`,
    },
    new Date(),
  )
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="clr-event-${event.id}.ics"`,
    },
  })
}
