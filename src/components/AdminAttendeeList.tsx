import ActionForm from '@/components/ActionForm'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { adminButtonClass } from '@/components/admin/styles'
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
      <button type="submit" className={adminButtonClass(checkedIn ? 'primary' : 'secondary')}>
        {checkedIn ? 'Đã đến' : 'Điểm danh'}
      </button>
    </ActionForm>
  )
}

function attendeeColumns(eventId: string): DataTableColumn<AdminAttendee>[] {
  return [
    { key: 'name', header: 'Thành viên', cell: (attendee) => <b>{attendee.displayName ?? 'Thành viên'}</b> },
    {
      key: 'status',
      header: 'Đăng ký',
      cell: (attendee) => <Badge tone={attendee.status === 'going' ? 'success' : 'neutral'}>{ATTENDANCE_LABELS[attendee.status]}</Badge>,
    },
    {
      key: 'activity',
      header: 'Hoạt động Strava',
      hideBelowMd: true,
      cell: (attendee) =>
        attendee.hasActivity ? (
          <Badge tone="info">{attendee.checkedInAt ? 'Có hoạt động khớp' : 'Khớp, nên điểm danh'}</Badge>
        ) : (
          '—'
        ),
    },
    { key: 'checkin', header: '', align: 'right', cell: (attendee) => <CheckinToggle eventId={eventId} attendee={attendee} /> },
  ]
}

export default function AdminAttendeeList({ eventId, attendees }: { eventId: string; attendees: AdminAttendee[] }) {
  return (
    <DataTable
      columns={attendeeColumns(eventId)}
      rows={attendees}
      rowKey={(attendee) => attendee.memberId}
      emptyText="Chưa có ai đăng ký."
    />
  )
}
