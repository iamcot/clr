import Image from 'next/image'
import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { EVENT_KIND_LABELS } from '@/config/events'
import { formatDateTile, formatEventStart } from '@/lib/events/eventFormat'
import { isRegistrationOpen } from '@/lib/events/eventTime'
import { setAttendance } from '@/lib/events/memberActions'
import type { EventCard } from '@/lib/events/loadEvents'

function DateTile({ startsAt }: { startsAt: string }) {
  const tile = formatDateTile(startsAt)
  return (
    <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-deep text-white">
      <span className="text-xs font-bold text-lime">{tile.weekday}</span>
      <span className="text-2xl leading-none font-black">{tile.day}</span>
      <span className="text-xs">{tile.month}</span>
    </div>
  )
}

function JoinButton({ event, now }: { event: EventCard; now: Date }) {
  if (event.status === 'cancelled') return <p className="text-sm font-bold text-danger">Đã huỷ</p>
  if (event.myStatus === 'going') return <p className="text-sm font-bold text-brand-dark">✓ Bạn đã đăng ký</p>
  if (event.myStatus === 'waitlist') return <p className="text-sm font-bold text-brand-dark">Bạn đang trong danh sách chờ</p>
  if (!isRegistrationOpen(event, now)) return null
  return (
    <ActionForm action={setAttendance}>
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="status" value="going" />
      <button type="submit" className="min-h-12 w-full rounded-full bg-brand font-bold text-white active:bg-brand-dark">
        Tham gia
      </button>
    </ActionForm>
  )
}

export function UpcomingEventCard({ event, now }: { event: EventCard; now: Date }) {
  const goingText = event.capacity ? `${event.counts.going}/${event.capacity}` : String(event.counts.going)
  return (
    <li className="rounded-2xl border border-line bg-white shadow-sm p-4">
      <Link href={`/events/${event.id}`} className="flex gap-3 active:opacity-70">
        <DateTile startsAt={event.startsAt} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-brand-dark">{EVENT_KIND_LABELS[event.kind]}</p>
          <p className="text-lg leading-snug font-black">{event.title}</p>
          <p className="text-sm text-muted">{formatEventStart(event.startsAt, event.locationName)}</p>
          <p className="text-sm text-muted">{goingText} người sẽ tham gia</p>
        </div>
      </Link>
      <div className="mt-3">
        <JoinButton event={event} now={now} />
      </div>
    </li>
  )
}

export function PastEventCard({ event }: { event: EventCard }) {
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Link href={`/events/${event.id}`} className="block active:opacity-70">
        {event.coverUrl ? (
          <Image
            src={event.coverUrl}
            alt=""
            width={480}
            height={240}
            className="h-32 w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="h-16 bg-deep" />
        )}
        <div className="p-3">
          <p className="font-black">{event.title}</p>
          <p className="text-sm text-muted">
            {event.counts.going} người tham gia · {event.counts.photos} ảnh
          </p>
        </div>
      </Link>
    </li>
  )
}
