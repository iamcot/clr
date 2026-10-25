const ICON_PROPS = {
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function HeartIcon({ filled = false, className = 'size-5' }: { filled?: boolean; className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  )
}

export function CommentIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className} fill="none">
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  )
}

export function SendIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2z" />
    </svg>
  )
}
