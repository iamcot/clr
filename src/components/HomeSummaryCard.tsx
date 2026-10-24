import Link from 'next/link'
import { formatVnd } from '@/lib/format/money'
import type { HomeSummary } from '@/lib/home/loadHomeSummary'
import { formatKm } from '@/lib/stats/format'

export default function HomeSummaryCard({ summary }: { summary: HomeSummary }) {
  const { mainChallenge } = summary
  return (
    <div className="rounded-lg bg-white p-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted">Tháng này</p>
          <p className="text-2xl font-black">{formatKm(summary.monthDistanceMeters)}</p>
        </div>
        <Link href="/me/stats" className="min-h-11 text-sm font-bold text-brand-dark underline">
          Thống kê
        </Link>
      </div>
      {mainChallenge && (
        <Link href={`/challenges/${mainChallenge.id}`} className="mt-2 block">
          <p className="text-sm font-bold">
            {mainChallenge.title}
            {mainChallenge.completed && ' ✓'}
          </p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand" style={{ width: `${Math.min(100, mainChallenge.progressPct)}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{Math.round(mainChallenge.progressPct)}% mục tiêu</p>
        </Link>
      )}
      {summary.unpaidAmount > 0 && (
        <Link href="/fund" className="mt-2 flex min-h-11 items-center justify-between rounded-lg bg-page px-3 text-sm">
          <span>Còn nợ quỹ</span>
          <span className="font-black text-danger">{formatVnd(summary.unpaidAmount)}</span>
        </Link>
      )}
    </div>
  )
}
