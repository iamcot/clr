import Link from 'next/link'
import BackLink from '@/components/BackLink'
import { parsePeriodValue, periodRange, shiftPeriod, summarizeEvents, type StatsPeriod } from '@/lib/events/eventStats'
import { loadEventStatsRows, loadTopAttendees } from '@/lib/events/loadEventStats'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatKm } from '@/lib/stats/format'

type SearchParams = { period?: string; value?: string }

function periodHref(period: StatsPeriod, value: string): string {
  return `/admin/events/stats?period=${period}&value=${value}`
}

function periodLabel(period: StatsPeriod, value: string): string {
  if (period === 'year') return `Năm ${value}`
  const [year, month] = value.split('-')
  return `Tháng ${Number(month)}/${year}`
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white shadow-sm p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  )
}

export default async function EventStatsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const period: StatsPeriod = params.period === 'year' ? 'year' : 'month'
  const value = parsePeriodValue(period, params.value, new Date())
  const { from, to } = periodRange(period, value)
  const [rows, top] = await Promise.all([loadEventStatsRows(from, to), loadTopAttendees(from, to)])
  const summary = summarizeEvents(rows)
  const rate = summary.attendanceRate === null ? '--' : `${Math.round(summary.attendanceRate * 100)}%`

  return (
    <section>
      <BackLink href="/admin/events">Event</BackLink>
      <h1 className="mt-2 text-2xl font-black">Thống kê event</h1>
      <div className="mt-3 flex gap-2">
        {(['month', 'year'] as const).map((item) => (
          <Link
            key={item}
            href={periodHref(item, parsePeriodValue(item, undefined, new Date()))}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold ${
              item === period ? 'bg-brand text-white' : 'bg-white'
            }`}
          >
            {item === 'month' ? 'Theo tháng' : 'Theo năm'}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Link href={periodHref(period, shiftPeriod(period, value, -1))} className="min-h-11 px-3 py-2 font-bold">
          ←
        </Link>
        <p className="font-black">{periodLabel(period, value)}</p>
        <Link href={periodHref(period, shiftPeriod(period, value, 1))} className="min-h-11 px-3 py-2 font-bold">
          →
        </Link>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Metric label="Số event" value={String(summary.eventCount)} />
        <Metric label="Lượt đăng ký" value={String(summary.registrations)} />
        <Metric label="Tỉ lệ đến thực tế" value={rate} />
        <Metric label="Tổng km tại event" value={formatKm(summary.totalDistanceM)} />
      </div>
      <h2 className="mt-6 text-lg font-black">Từng event</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.eventId} className="rounded-lg bg-white shadow-sm p-3 text-sm">
            <p className="font-bold">{row.title}</p>
            <p className="text-muted">
              {formatDateVi(row.startsAt)} · đăng ký {row.registeredCount} · đến {row.attendedCount} ·{' '}
              {formatKm(row.totalDistanceM)}
            </p>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="mt-2 text-muted">Chưa có event trong kỳ này.</p>}
      <h2 className="mt-6 text-lg font-black">Đi event nhiều nhất</h2>
      <ol className="mt-2 flex flex-col gap-1">
        {top.map((person, index) => (
          <li key={person.memberId} className="flex justify-between rounded-lg bg-white shadow-sm p-3 text-sm">
            <span>
              {index + 1}. {person.displayName ?? 'Thành viên'}
            </span>
            <span className="font-bold">{person.eventCount} event</span>
          </li>
        ))}
      </ol>
      {top.length === 0 && <p className="mt-2 text-muted">Chưa có ai điểm danh trong kỳ này.</p>}
    </section>
  )
}
