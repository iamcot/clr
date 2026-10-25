import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge, { type BadgeTone } from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { adminButtonClass } from '@/components/admin/styles'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { EVENT_KIND_LABELS, EVENT_STATUS_LABELS } from '@/config/events'
import { loadAdminEvents, type AdminEventRow } from '@/lib/events/loadAdminEvents'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import type { EventStatus } from '@/lib/types/database'

const STATUS_TONES: Record<EventStatus, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  cancelled: 'danger',
  done: 'info',
}

const EVENT_COLUMNS: DataTableColumn<AdminEventRow>[] = [
  { key: 'title', header: 'Event', isLink: true, cell: (event) => event.title },
  { key: 'kind', header: 'Loại', hideBelowMd: true, cell: (event) => EVENT_KIND_LABELS[event.kind] },
  {
    key: 'status',
    header: 'Trạng thái',
    cell: (event) => <Badge tone={STATUS_TONES[event.status]}>{EVENT_STATUS_LABELS[event.status]}</Badge>,
  },
  { key: 'start', header: 'Thời gian', cell: (event) => formatDateTimeVi(event.startsAt) },
  {
    key: 'going',
    header: 'Đi',
    align: 'right',
    cell: (event) => `${event.goingCount}${event.capacity ? `/${event.capacity}` : ''}`,
  },
]

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const { rows: events, window } = slicePage(await loadAdminEvents(), parsePage(params.page))

  return (
    <section>
      <AdminPageHeader
        title="Event"
        description="Quản lý event, đăng ký và album ảnh"
        actions={
          <>
            <Link href="/admin/events/stats" className={adminButtonClass('secondary')}>
              Thống kê
            </Link>
            <Link href="/admin/events/new" className={adminButtonClass('primary')}>
              + Tạo event
            </Link>
          </>
        }
      />
      <DataTable
        columns={EVENT_COLUMNS}
        rows={events}
        rowKey={(event) => event.id}
        rowHref={(event) => `/admin/events/${event.id}`}
        emptyText="Chưa có event nào."
      />
      <Pagination window={window} hrefFor={(page) => hrefWithPage('/admin/events', params, page)} unit="event" />
    </section>
  )
}
