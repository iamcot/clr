import Link from 'next/link'

type QuickLink = { href: string; label: string; iconClass: string; icon: React.ReactNode }

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-6',
  'aria-hidden': true,
} as const

const QUICK_LINKS: QuickLink[] = [
  {
    href: '/members',
    label: 'Thành viên',
    iconClass: 'bg-brand/10 text-brand',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
        <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.8c1.7.7 3 2.4 3.5 5.2" />
      </svg>
    ),
  },
  {
    href: '/rankings',
    label: 'Xếp hạng',
    iconClass: 'bg-gold/20 text-brand-dark',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 20V11M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: '/hall-of-fame',
    label: 'Bảng vàng',
    iconClass: 'bg-lime/25 text-deep',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="9" r="6" />
        <path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" />
      </svg>
    ),
  },
  {
    href: '/draws',
    label: 'Quay số',
    iconClass: 'bg-danger/10 text-danger',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13M5 12v9h14v-9M12 8c-1-3-5-4-5-1.5S10 8 12 8c1-3 5-4 5-1.5S14 8 12 8Z" />
      </svg>
    ),
  },
]

export default function HomeQuickLinks() {
  return (
    <ul className="mt-3 grid grid-cols-4 gap-2">
      {QUICK_LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="flex flex-col items-center gap-1 rounded-xl py-2 active:bg-line/50">
            <span className={`flex size-12 items-center justify-center rounded-2xl ${link.iconClass}`}>{link.icon}</span>
            <span className="text-center text-xs font-bold">{link.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
