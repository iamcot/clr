import Link from 'next/link'

type ChallengeCardProps = {
  href: string
  title: string
  subtitle: string
  progressPct?: number | null
  badge?: string
}

export default function ChallengeCard({ href, title, subtitle, progressPct, badge }: ChallengeCardProps) {
  return (
    <Link href={href} className="block rounded-lg bg-white p-3 active:bg-line">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{title}</p>
        {badge && <span className="shrink-0 rounded-full bg-lime/40 px-2 py-0.5 text-xs font-bold">{badge}</span>}
      </div>
      <p className="text-sm text-muted">{subtitle}</p>
      {progressPct != null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-brand" style={{ width: `${Math.min(100, progressPct)}%` }} />
        </div>
      )}
    </Link>
  )
}
