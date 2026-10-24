import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import AdminAttendeeList from '@/components/AdminAttendeeList'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import Pagination from '@/components/admin/Pagination'
import { adminButtonClass } from '@/components/admin/styles'
import CheckinPanel from '@/components/CheckinPanel'
import EventForm from '@/components/EventForm'
import { EVENT_KIND_LABELS, EVENT_STATUS_LABELS } from '@/config/events'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import { getAppUrl } from '@/lib/env'
import { createAbsentPenalties, loadCheckinCode } from '@/lib/events/adminActions'
import { isPastEvent } from '@/lib/events/eventTime'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { eventFormDefaults } from '@/lib/events/formDefaults'
import { loadAdminAttendees, loadAdminEvent } from '@/lib/events/loadAdminEvents'

const TABS = ['edit', 'attendees', 'checkin'] as const

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const event = await loadAdminEvent(id)
  if (!event) notFound()
  const published = event.status === 'published'
  const tab = pickTab(TABS, query.tab, 'edit')
  const [attendees, checkinCode] = await Promise.all([
    loadAdminAttendees(id),
    published && tab === 'checkin' ? loadCheckinCode(id) : null,
  ])
  const registered = attendees.filter((attendee) => attendee.status !== 'not_going')
  const paged = slicePage(registered, parsePage(query.page))
  const goingCount = attendees.filter((attendee) => attendee.status === 'going').length
  const past = isPastEvent(event, new Date())
  const absentCount = attendees.filter(
    (attendee) => attendee.status === 'going' && !attendee.checkedInAt && !attendee.hasActivity,
  ).length
  const basePath = `/admin/events/${id}`

  const tabItems = [
    { href: basePath, label: 'Chỉnh sửa', active: tab === 'edit' },
    { href: `${basePath}?tab=attendees`, label: `Người đăng ký (${goingCount})`, active: tab === 'attendees' },
    ...(published ? [{ href: `${basePath}?tab=checkin`, label: 'Điểm danh', active: tab === 'checkin' }] : []),
  ]

  return (
    <section>
      <AdminPageHeader
        title={event.title}
        backHref="/admin/events"
        backLabel="Event"
        description={`${EVENT_KIND_LABELS[event.kind]} · ${formatDateTimeVi(event.startsAt)}`}
        actions={
          <>
            <Link href={`/events/${id}`} className={adminButtonClass('secondary')}>
              Xem như thành viên
            </Link>
            <Link href={`${basePath}/photos`} className={adminButtonClass('secondary')}>
              Quản lý ảnh
            </Link>
          </>
        }
      />
      <div className="mb-4">
        <Badge tone={published ? 'success' : 'neutral'}>{EVENT_STATUS_LABELS[event.status]}</Badge>
      </div>
      <AdminTabs items={tabItems} />

      <div className="mt-4">
        {tab === 'edit' && <EventForm defaults={eventFormDefaults(event)} />}

        {tab === 'attendees' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <form method="post" action={`${basePath}/link-activities`}>
                <button type="submit" className={adminButtonClass('secondary')}>
                  Quét hoạt động Strava khớp với event
                </button>
              </form>
              {past && event.absentPenalty && (
                <ActionForm action={createAbsentPenalties}>
                  <input type="hidden" name="event_id" value={id} />
                  <button type="submit" className={adminButtonClass('danger')}>
                    Sinh phạt cho {absentCount} người vắng
                  </button>
                </ActionForm>
              )}
            </div>
            <div>
              <AdminAttendeeList eventId={id} attendees={paged.rows} />
              <Pagination
                window={paged.window}
                hrefFor={(page) => hrefWithPage(basePath, query, page)}
                unit="người đăng ký"
              />
            </div>
          </div>
        )}

        {tab === 'checkin' && published && (
          <AdminCard title="Mã điểm danh">
            <CheckinPanel eventId={id} origin={getAppUrl()} initial={checkinCode} />
          </AdminCard>
        )}
      </div>
    </section>
  )
}
