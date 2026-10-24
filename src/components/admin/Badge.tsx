export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-surface text-muted',
  success: 'border-brand/30 bg-brand/10 text-brand-dark',
  warning: 'border-gold/50 bg-gold/20 text-deep',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-water/40 bg-water/15 text-water-deep',
}

export default function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 text-xs font-bold whitespace-nowrap ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  )
}
