import ActionForm from '@/components/ActionForm'
import { ATTENDANCE_LABELS } from '@/config/events'
import { setCheckin } from '@/lib/events/adminActions'
import type { AdminAttendee } from '@/lib/events/loadAdminEvents'

function CheckinToggle({ eventId, attendee }: { eventId: string; attendee: AdminAttendee }) {
  const checkedIn = attendee.checkedInAt !== null
  return (
    <ActionForm action={setCheckin}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="member_id" value={attendee.memberId} />
      <input type="hidden" name="checked_in" value={checkedIn ? '0' : '1'} />
      <button
        type="submit"
        className={`min-h-11 rounded-lg px-3 text-sm font-bold ${
          checkedIn ? 'bg-brand text-white' : 'border border-line bg-white'
        }`}
      >
        {checkedIn ? 'Đã đến' : 'Điểm danh'}
      </button>
    </ActionForm>
  )
}

export default function AdminAttendeeList({ eventId, attendees }: { eventId: string; attendees: AdminAttendee[] }) {
  const registered = attendees.filter((attendee) => attendee.status !== 'not_going')
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {registered.map((attendee) => (
        <li key={attendee.memberId} className="flex items-center justify-between gap-2 rounded-lg bg-white shadow-sm px-3 py-1">
          <div className="min-w-0">
            <p className="truncate font-bold">{attendee.displayName ?? 'Thành viên'}</p>
            <p className="text-xs text-muted">
              {ATTENDANCE_LABELS[attendee.status]}
              {attendee.hasActivity && !attendee.checkedInAt && ' · có hoạt động khớp, nên điểm danh'}
              {attendee.hasActivity && attendee.checkedInAt && ' · có hoạt động khớp'}
            </p>
          </div>
          <CheckinToggle eventId={eventId} attendee={attendee} />
        </li>
      ))}
      {registered.length === 0 && <p className="text-muted">Chưa có ai đăng ký.</p>}
    </ul>
  )
}
