type MedalIconProps = { className?: string }

// Huy chương tròn có dải ruy băng, màu theo currentColor
export default function MedalIcon({ className = 'size-6' }: MedalIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 2h4l1 6H8zM17 2h-4l-1 6h4z" fill="currentColor" opacity="0.55" />
      <circle cx="12" cy="15" r="6.5" fill="currentColor" />
      <circle cx="12" cy="15" r="4.2" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" />
    </svg>
  )
}
