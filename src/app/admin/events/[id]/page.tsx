import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import AdminAttendeeList from '@/components/AdminAttendeeList'
import CheckinPanel from '@/components/CheckinPanel'
import EventForm from '@/components/EventForm'
import { getAppUrl } from '@/lib/env'
import { createAbsentPenalties, loadCheckinCode } from '@/lib/events/adminActions'
import { isPastEvent } from '@/lib/events/eventTime'
import { eventFormDefaults } from '@/lib/events/formDefaults'
import { loadAdminAttendees, loadAdminEvent } from '@/lib/events/loadAdminEvents'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await loadAdminEvent(id)
  if (!event) notFound()
  const [attendees, checkinCode] = await Promise.all([
    loadAdminAttendees(id),
    event.status === 'published' ? loadCheckinCode(id) : null,
  ])
  const past = isPastEvent(event, new Date())
  const absentCount = attendees.filter(
    (attendee) => attendee.status === 'going' && !attendee.checkedInAt && !attendee.hasActivity,
  ).length

  return (
    <section>
      <Link href="/admin/events" className="text-sm text-muted">
        ← Event
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-black">{event.title}</h1>
      <div className="mb-4 flex gap-2">
        <Link
          href={`/events/${id}`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line bg-white font-bold"
        >
          Xem như thành viên
        </Link>
        <Link
          href={`/admin/events/${id}/photos`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line bg-white font-bold"
        >
          Quản lý ảnh
        </Link>
      </div>
      {event.status === 'published' && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-black">Điểm danh</h2>
          <CheckinPanel eventId={id} origin={getAppUrl()} initial={checkinCode} />
        </div>
      )}
      <EventForm defaults={eventFormDefaults(event)} />
      <h2 className="mt-8 text-lg font-black">Người đăng ký ({attendees.filter((a) => a.status === 'going').length})</h2>
      <form method="post" action={`/admin/events/${id}/link-activities`} className="mt-2">
        <button type="submit" className="min-h-11 w-full rounded-lg border border-line bg-white font-bold">
          Quét hoạt động Strava khớp với event
        </button>
      </form>
      <AdminAttendeeList eventId={id} attendees={attendees} />
      {past && event.absentPenalty && (
        <ActionForm action={createAbsentPenalties} className="mt-4">
          <input type="hidden" name="event_id" value={id} />
          <button type="submit" className="min-h-12 w-full rounded-lg border border-danger font-bold text-danger">
            Sinh phạt cho {absentCount} người vắng
          </button>
        </ActionForm>
      )}
    </section>
  )
}
