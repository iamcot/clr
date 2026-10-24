'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_TABS } from '@/config/nav'
import type { TabIcon } from '@/config/nav'

const ICON_PATHS: Record<TabIcon, string> = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  challenge: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3',
  event: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  fund: 'M3 7h18v12H3zM3 11h18M16 15h2',
  me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function TabGlyph({ icon }: { icon: TabIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[icon]} />
    </svg>
  )
}

export default function AppTabs({ homeBadge = 0 }: { homeBadge?: number }) {
  const pathname = usePathname()
  const tabs = NAV_TABS.filter((tab) => tab.enabled)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[480px]">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href)
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  active ? 'text-brand' : 'text-muted'
                }`}
              >
                <span className="relative">
                  <TabGlyph icon={tab.icon} />
                  {tab.href === '/' && homeBadge > 0 && (
                    <span
                      aria-label={`${homeBadge} bài chưa đọc`}
                      className="absolute -top-1 -right-2 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] leading-4 font-bold text-white"
                    >
                      {homeBadge > 9 ? '9+' : homeBadge}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
