import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { parsePeriodValue, periodRange, shiftPeriod, summarizeEvents, type StatsPeriod } from '@/lib/events/eventStats'
import { loadEventStatsRows, loadTopAttendees } from '@/lib/events/loadEventStats'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatKm } from '@/lib/stats/format'

type SearchParams = { period?: string; value?: string; page?: string }
type EventRow = Awaited<ReturnType<typeof loadEventStatsRows>>[number]
type TopRow = Awaited<ReturnType<typeof loadTopAttendees>>[number]

function periodHref(period: StatsPeriod, value: string): string {
  return `/admin/events/stats?period=${period}&value=${value}`
}

function periodLabel(period: StatsPeriod, value: string): string {
  if (period === 'year') return `Năm ${value}`
  const [year, month] = value.split('-')
  return `Tháng ${Number(month)}/${year}`
}

const EVENT_COLUMNS: DataTableColumn<EventRow>[] = [
  { key: 'title', header: 'Event', cell: (row) => <b>{row.title}</b> },
  { key: 'date', header: 'Ngày', hideBelowMd: true, cell: (row) => formatDateVi(row.startsAt) },
  { key: 'registered', header: 'Đăng ký', align: 'right', cell: (row) => row.registeredCount },
  { key: 'attended', header: 'Đến', align: 'right', cell: (row) => row.attendedCount },
  { key: 'km', header: 'Tổng km', align: 'right', hideBelowMd: true, cell: (row) => formatKm(row.totalDistanceM) },
]

const TOP_COLUMNS: DataTableColumn<TopRow>[] = [
  { key: 'name', header: 'Thành viên', cell: (row) => <b>{row.displayName ?? 'Thành viên'}</b> },
  { key: 'count', header: 'Số event', align: 'right', cell: (row) => row.eventCount },
]

export default async function EventStatsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const period: StatsPeriod = params.period === 'year' ? 'year' : 'month'
  const value = parsePeriodValue(period, params.value, new Date())
  const { from, to } = periodRange(period, value)
  const [rows, top] = await Promise.all([loadEventStatsRows(from, to), loadTopAttendees(from, to)])
  const summary = summarizeEvents(rows)
  const rate = summary.attendanceRate === null ? '--' : `${Math.round(summary.attendanceRate * 100)}%`
  const pagedRows = slicePage(rows, parsePage(params.page))

  return (
    <section>
      <AdminPageHeader title="Thống kê event" backHref="/admin/events" backLabel="Event" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs
          items={(['month', 'year'] as const).map((item) => ({
            href: periodHref(item, parsePeriodValue(item, undefined, new Date())),
            label: item === 'month' ? 'Theo tháng' : 'Theo năm',
            active: item === period,
          }))}
        />
        <div className="flex items-center gap-2">
          <Link href={periodHref(period, shiftPeriod(period, value, -1))} className={adminButtonClass('secondary')} aria-label="Kỳ trước">
            ←
          </Link>
          <span className="min-w-28 text-center font-black">{periodLabel(period, value)}</span>
          <Link href={periodHref(period, shiftPeriod(period, value, 1))} className={adminButtonClass('secondary')} aria-label="Kỳ sau">
            →
          </Link>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Số event" value={summary.eventCount} />
        <StatCard label="Lượt đăng ký" value={summary.registrations} />
        <StatCard label="Tỉ lệ đến thực tế" value={rate} />
        <StatCard label="Tổng km tại event" value={formatKm(summary.totalDistanceM)} />
      </div>
      <h2 className="mt-6 mb-2 text-lg font-black">Từng event</h2>
      <DataTable columns={EVENT_COLUMNS} rows={pagedRows.rows} rowKey={(row) => row.eventId} emptyText="Chưa có event trong kỳ này." />
      <Pagination
        window={pagedRows.window}
        hrefFor={(page) => hrefWithPage('/admin/events/stats', params, page)}
        unit="event"
      />
      <h2 className="mt-6 mb-2 text-lg font-black">Đi event nhiều nhất</h2>
      <DataTable columns={TOP_COLUMNS} rows={top} rowKey={(row) => row.memberId} emptyText="Chưa có ai điểm danh trong kỳ này." />
    </section>
  )
}
