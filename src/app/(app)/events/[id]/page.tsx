import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AttendanceButtons from '@/components/AttendanceButtons'
import Markdown from '@/components/Markdown'
import { EVENT_KIND_LABELS } from '@/config/events'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatEventSchedule } from '@/lib/events/eventFormat'
import { isPastEvent, isRegistrationOpen } from '@/lib/events/eventTime'
import { loadEventDetail, loadEventRunSummary, type EventDetail } from '@/lib/events/loadEvents'
import { googleMapsUrl } from '@/lib/events/mapsLink'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'
import { formatKm, formatPaceValue } from '@/lib/stats/format'

const LINK_BUTTON = 'flex min-h-12 items-center justify-center rounded-full border border-brand font-bold text-brand-dark'

function Participants({ event }: { event: EventDetail }) {
  const hidden = Math.max(0, event.counts.going - event.goingParticipants.length)
  return (
    <div className="mt-6">
      <h2 className="text-xl font-black">
        Người tham gia ({event.counts.going}
        {event.capacity ? `/${event.capacity}` : ''})
      </h2>
      {event.counts.going === 0 && <p className="mt-2 text-muted">Chưa có ai đăng ký.</p>}
      <ul className="mt-3 flex flex-wrap gap-2">
        {event.goingParticipants.map((person) => (
          <li key={person.memberId} title={person.displayName ?? ''}>
            {person.avatarUrl ? (
              <Image src={person.avatarUrl} alt={person.displayName ?? ''} width={40} height={40} className="rounded-full" unoptimized />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm font-bold">
                {(person.displayName ?? '?').slice(0, 1)}
              </span>
            )}
          </li>
        ))}
        {hidden > 0 && (
          <li className="flex size-10 items-center justify-center rounded-full bg-line text-xs font-bold">+{hidden}</li>
        )}
      </ul>
      {event.counts.maybe > 0 && <p className="mt-2 text-sm text-muted">{event.counts.maybe} người “có thể” đi</p>}
      {event.counts.waitlist > 0 && <p className="text-sm text-muted">{event.counts.waitlist} người trong danh sách chờ</p>}
    </div>
  )
}

async function PastSummary({ eventId }: { eventId: string }) {
  const summary = await loadEventRunSummary(eventId)
  if (!summary) return null
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-deep p-4 text-center text-white">
      <div>
        <p className="text-xl font-black">{summary.attendedCount}</p>
        <p className="text-xs text-white/70">người đến</p>
      </div>
      <div>
        <p className="text-xl font-black">{formatKm(summary.totalDistanceM)}</p>
        <p className="text-xs text-white/70">tổng quãng đường</p>
      </div>
      <div>
        <p className="text-xl font-black">{formatPaceValue(summary.totalDistanceM, summary.totalMovingTimeS)}</p>
        <p className="text-xs text-white/70">pace TB /km</p>
      </div>
    </div>
  )
}

function StatusNotice({ event, now }: { event: EventDetail; now: Date }) {
  if (event.status === 'cancelled') return <p className="mt-4 rounded-xl bg-danger/10 p-3 font-bold text-danger">Event đã huỷ</p>
  if (!isRegistrationOpen(event, now) && !isPastEvent(event, now)) {
    return <p className="mt-4 text-sm text-muted">Đã hết hạn đăng ký.</p>
  }
  return null
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireActiveMember()
  const { id } = await params
  const event = await loadEventDetail(id, member.id)
  if (!event) notFound()

  const now = new Date()
  const past = isPastEvent(event, now)
  const mapsUrl = googleMapsUrl({ lat: event.locationLat, lng: event.locationLng, name: event.locationName })

  return (
    <section>
      <Link href="/events" className="flex min-h-11 items-center font-bold text-brand-dark">
        ← Event
      </Link>
      {event.coverUrl && (
        <Image src={event.coverUrl} alt="" width={480} height={240} className="h-44 w-full rounded-2xl object-cover" unoptimized />
      )}
      <p className="mt-3 text-xs font-bold text-brand-dark">{EVENT_KIND_LABELS[event.kind]}</p>
      <h1 className="text-2xl leading-snug font-black">{event.title}</h1>
      <p className="mt-1 text-muted">{formatEventSchedule(event.startsAt, event.endsAt)}</p>
      {event.locationName && <p className="text-muted">{event.locationName}</p>}
      {event.routeDistanceM && <p className="text-muted">Cự ly dự kiến: {formatKm(event.routeDistanceM)}</p>}
      {event.fee !== null && event.fee > 0 && <p className="text-muted">Phí tham gia: {formatVnd(event.fee)}</p>}
      {!past && (
        <p className="text-sm text-muted">
          Hạn đăng ký: {formatDateTimeVi(event.registrationClosesAt ?? event.startsAt)}
        </p>
      )}
      <StatusNotice event={event} now={now} />
      {past && <PastSummary eventId={event.id} />}
      {isRegistrationOpen(event, now) && (
        <div className="mt-4">
          <AttendanceButtons eventId={event.id} current={event.myStatus} />
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`${LINK_BUTTON} flex-1`}>
            Xem bản đồ
          </a>
        )}
        {event.status === 'published' && !past && (
          <a href={`/events/${event.id}/calendar.ics`} className={`${LINK_BUTTON} flex-1`}>
            Thêm vào lịch
          </a>
        )}
      </div>
      {event.descriptionMd && (
        <div className="mt-6 rounded-2xl border border-line bg-white shadow-sm p-4">
          <Markdown source={event.descriptionMd} />
        </div>
      )}
      <Participants event={event} />
      <Link href={`/events/${event.id}/photos`} className={`${LINK_BUTTON} mt-6`}>
        Album ảnh ({event.counts.photos})
      </Link>
    </section>
  )
}
