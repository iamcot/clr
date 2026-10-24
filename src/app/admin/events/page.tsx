import Link from 'next/link'
import { EVENT_KIND_LABELS, EVENT_STATUS_LABELS } from '@/config/events'
import { loadAdminEvents } from '@/lib/events/loadAdminEvents'
import { formatDateTimeVi } from '@/lib/format/dateTime'

export default async function AdminEventsPage() {
  const events = await loadAdminEvents()

  return (
    <section>
      <h1 className="text-2xl font-black">Event</h1>
      <div className="mt-3 flex gap-2">
        <Link
          href="/admin/events/new"
          className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
        >
          Tạo event
        </Link>
        <Link
          href="/admin/events/stats"
          className="flex min-h-12 flex-1 items-center justify-center rounded-lg border border-line bg-white font-bold"
        >
          Thống kê
        </Link>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link href={`/admin/events/${event.id}`} className="block rounded-lg bg-white shadow-sm p-3">
              <p className="font-bold">{event.title}</p>
              <p className="text-sm text-muted">
                {EVENT_KIND_LABELS[event.kind]} · {EVENT_STATUS_LABELS[event.status]} ·{' '}
                {formatDateTimeVi(event.startsAt)} · {event.goingCount}
                {event.capacity ? `/${event.capacity}` : ''} người đi
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {events.length === 0 && <p className="mt-4 text-muted">Chưa có event nào.</p>}
    </section>
  )
}
