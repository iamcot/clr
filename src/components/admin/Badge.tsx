export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-line text-muted',
  success: 'bg-brand/10 text-brand-dark',
  warning: 'bg-gold/25 text-deep',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-water/20 text-water-deep',
}

export default function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  )
}
