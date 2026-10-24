'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ADMIN_NAV_GROUPS, type AdminNavGroup } from '@/config/adminNav'

function isCurrent(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavGroup({ group, onNavigate }: { group: AdminNavGroup; onNavigate: () => void }) {
  const pathname = usePathname()

  return (
    <div className="mt-4 first:mt-0">
      {group.title && (
        <p className="px-3 pb-1 text-xs font-bold text-muted">{group.title}</p>
      )}
      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => {
          if (!item.enabled) {
            return (
              <li key={item.href} className="flex min-h-11 items-center px-3 text-muted/60">
                {item.label}
                <span className="ml-2 text-xs">Sắp có</span>
              </li>
            )
          }
          const current = isCurrent(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={current ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-bold md:min-h-10 ${
                  current ? 'bg-brand/10 text-brand-dark' : 'text-ink active:bg-surface md:hover:bg-surface'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav aria-label="Menu quản trị" className="flex min-h-full flex-col">
      <div className="flex-1">
        {ADMIN_NAV_GROUPS.map((group) => (
          <NavGroup key={group.title ?? 'root'} group={group} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-0.5 border-t border-hairline pt-3">
        <Link href="/" className="flex min-h-11 items-center px-3 text-sm text-muted">
          ← Về app
        </Link>
        <form action="/api/auth/logout?to=admin" method="post">
          <button type="submit" className="flex min-h-11 w-full items-center px-3 text-left text-sm text-muted">
            Đăng xuất
          </button>
        </form>
      </div>
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-black text-white">CLR</span>
      <span className="font-black">Quản trị CLR</span>
    </div>
  )
}

export default function AdminMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-hairline bg-white px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-ink md:hidden print:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
          onClick={() => setOpen((value) => !value)}
          className="flex size-11 items-center justify-center rounded-lg text-2xl active:bg-surface"
        >
          {open ? '✕' : '☰'}
        </button>
        <Brand />
      </header>
      <div
        className={`fixed inset-0 z-20 md:hidden print:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Đóng menu"
          onClick={close}
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-white p-3 pt-[calc(4rem+env(safe-area-inset-top))] text-ink transition-transform ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent onNavigate={close} />
        </div>
      </div>
      <aside className="hidden w-60 shrink-0 border-r border-hairline bg-white text-ink md:block print:hidden">
        <div className="sticky top-0 flex max-h-dvh flex-col overflow-y-auto p-3">
          <div className="px-3 py-3">
            <Brand />
          </div>
          <SidebarContent onNavigate={close} />
        </div>
      </aside>
    </>
  )
}
