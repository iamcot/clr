import Link from 'next/link'
import StatsBarChart from '@/components/StatsBarChart'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDuration, formatKm, formatPace } from '@/lib/stats/format'
import { loadOwnActiveDates } from '@/lib/stats/loadActiveDates'
import { loadOwnStatsPeriods, type PeriodStats } from '@/lib/stats/loadStatsPeriods'
import { longestStreak, percentChange } from '@/lib/stats/periods'
import { nextPeriodStart, parsePeriodType, PERIOD_TABS, toChartBars } from '@/lib/stats/statsView'

const PREVIOUS_PERIOD_LABELS = { week: 'tuần trước', month: 'tháng trước', year: 'năm trước' } as const

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white shadow-sm p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  )
}

function ChangeNote({ current, previous, periodLabel }: { current: number; previous: number; periodLabel: string }) {
  const change = percentChange(current, previous)
  if (change === null) return <p className="mt-1 text-sm text-muted">Chưa có số liệu {periodLabel} để so sánh.</p>
  const sign = change > 0 ? '+' : ''
  return (
    <p className="mt-1 text-sm text-muted">
      <strong className={change >= 0 ? 'text-brand-dark' : 'text-danger'}>
        {sign}
        {change}%
      </strong>{' '}
      so với {periodLabel}
    </p>
  )
}

function ChallengePenaltyBlock() {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">Challenge và phạt</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Challenge đã tham gia" value="—" />
        <Stat label="Hoàn thành" value="—" />
        <Stat label="Số lần bị phạt" value="—" />
        <Stat label="Còn nợ" value="—" />
      </div>
    </section>
  )
}

export default async function MyStatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const member = await requireActiveMember()
  const type = parsePeriodType((await searchParams).period)
  const periods = await loadOwnStatsPeriods(member.id, type, new Date())
  const current = periods[periods.length - 1] as PeriodStats
  const previous = periods[periods.length - 2]
  const activeDates = await loadOwnActiveDates(
    member.id,
    member.share_private_in_totals,
    current.periodStart,
    nextPeriodStart(type, current.periodStart),
  )

  return (
    <section>
      <Link href="/me" className="text-sm text-muted">
        ← Tôi
      </Link>
      <h1 className="mt-2 text-2xl font-black">Thống kê</h1>
      <div className="mt-3 flex gap-2">
        {PERIOD_TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/me/stats?period=${tab.type}`}
            aria-current={tab.type === type ? 'page' : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-lg font-bold ${
              tab.type === type ? 'bg-brand text-white' : 'bg-white text-ink'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <p className="mt-4 text-3xl font-black">{formatKm(current.distanceMeters)}</p>
      {previous && (
        <ChangeNote
          current={current.distanceMeters}
          previous={previous.distanceMeters}
          periodLabel={PREVIOUS_PERIOD_LABELS[type]}
        />
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Số buổi" value={String(current.activityCount)} />
        <Stat label="Thời gian chạy" value={current.movingTimeSeconds ? formatDuration(current.movingTimeSeconds) : '—'} />
        <Stat label="Pace TB" value={formatPace(current.distanceMeters, current.movingTimeSeconds)} />
        <Stat label="Độ cao" value={`${Math.round(current.elevationGainMeters)} m`} />
        <Stat label="Buổi dài nhất" value={formatKm(current.longestMeters)} />
        <Stat label="Số ngày chạy" value={String(current.activeDays)} />
        <Stat label="Chuỗi ngày liên tiếp dài nhất" value={`${longestStreak(activeDates)} ngày`} />
      </div>
      <section className="mt-6">
        <h2 className="text-lg font-black">Km theo {type === 'week' ? 'tuần' : type === 'month' ? 'tháng' : 'năm'}</h2>
        <StatsBarChart key={type} bars={toChartBars(type, periods)} />
      </section>
      <ChallengePenaltyBlock />
    </section>
  )
}
