import Link from 'next/link'
import BackLink from '@/components/BackLink'
import StatsBarChart from '@/components/StatsBarChart'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatVnd } from '@/lib/format/money'
import { formatDuration, formatKm, formatPace } from '@/lib/stats/format'
import { loadOwnChallengePenalty, type OwnChallengePenalty } from '@/lib/stats/loadChallengePenalty'
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

function ChallengePenaltyBlock({ data }: { data: OwnChallengePenalty }) {
  const { summary, entries } = data
  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">Challenge và phạt</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Challenge đã tham gia" value={String(summary.joinedCount)} />
        <Stat label="Hoàn thành" value={String(summary.completedCount)} />
        <Stat label="Số lần bị phạt" value={String(summary.penaltyCount)} />
        <Stat label="Còn nợ" value={formatVnd(summary.unpaidAmount)} />
      </div>
      {entries.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/challenges/${entry.id}`}
                className="flex min-h-11 items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-sm"
              >
                <span className="min-w-0 truncate font-bold">{entry.title}</span>
                <span className={`shrink-0 text-sm font-bold ${entry.completed ? 'text-brand-dark' : 'text-muted'}`}>
                  {entry.completed ? '✓ Hoàn thành' : `${Math.round(entry.progressPct)}%`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function MyStatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const member = await requireActiveMember()
  const type = parsePeriodType((await searchParams).period)
  const [periods, challengePenalty] = await Promise.all([
    loadOwnStatsPeriods(member.id, type, new Date()),
    loadOwnChallengePenalty(member.id),
  ])
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
      <BackLink href="/me">Tôi</BackLink>
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
      <ChallengePenaltyBlock data={challengePenalty} />
    </section>
  )
}
