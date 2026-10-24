import Link from 'next/link'
import type { HomeChallenge, HomeSummary } from '@/lib/home/loadHomeSummary'
import { formatKm } from '@/lib/stats/format'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-black">{value}</p>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  )
}

function ChallengeProgress({ challenge }: { challenge: HomeChallenge }) {
  const percent = Math.min(100, challenge.progressPct)
  return (
    <Link href={`/challenges/${challenge.id}`} className="mt-4 block rounded-xl bg-white/10 p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="font-bold">
          {challenge.title} · {challenge.goalText}
        </p>
        <p className="font-black text-lime">{Math.round(challenge.progressPct)}%</p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-lime" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-white/70">{challenge.remainingText}</p>
    </Link>
  )
}

export default function HomeSummaryCard({ summary }: { summary: HomeSummary }) {
  const [distanceValue = '0', distanceUnit = 'km'] = formatKm(summary.monthDistanceMeters).split(' ')
  return (
    <div className="rounded-3xl bg-deep p-4 text-white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-white/80">Tháng {summary.monthNumber} của bạn</p>
        <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-deep">
          Level {summary.level} · {summary.levelName}
        </span>
      </div>
      <Link href="/me/stats" className="mt-3 flex items-baseline gap-2">
        <span className="text-6xl font-black leading-none">{distanceValue}</span>
        <span className="text-xl font-bold text-lime">{distanceUnit}</span>
      </Link>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat value={String(summary.activityCount)} label="buổi chạy" />
        <Stat value={summary.averagePace} label="pace TB /km" />
        <Stat value={summary.clubRank ? `#${summary.clubRank}` : '--'} label="hạng CLB" />
      </div>
      {summary.mainChallenge && <ChallengeProgress challenge={summary.mainChallenge} />}
    </div>
  )
}
