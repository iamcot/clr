import Link from 'next/link'
import { PastEventCard, UpcomingEventCard } from '@/components/EventCardView'
import { activeMemberOf, getViewer } from '@/lib/auth/viewer'
import { splitUpcomingAndPast } from '@/lib/events/eventTime'
import { loadEventCards } from '@/lib/events/loadEvents'

export default async function EventsPage() {
  const viewer = await getViewer()
  const now = new Date()
  const { upcoming, past } = splitUpcomingAndPast(await loadEventCards(activeMemberOf(viewer)?.id ?? null), now)

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Event</h1>
        {viewer.kind === 'member' && (
          <Link href="/photos" className="flex min-h-11 items-center font-bold text-brand-dark underline">
            Album ảnh
          </Link>
        )}
      </div>
      <h2 className="mt-4 text-xl font-black">Sắp tới</h2>
      {upcoming.length === 0 && <p className="mt-2 text-muted">Chưa có event nào sắp tới.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {upcoming.map((event) => (
          <UpcomingEventCard key={event.id} event={event} now={now} viewerKind={viewer.kind} />
        ))}
      </ul>
      {past.length > 0 && (
        <>
          <h2 className="mt-6 text-xl font-black">Đã qua</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {past.map((event) => (
              <PastEventCard key={event.id} event={event} viewerKind={viewer.kind} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
