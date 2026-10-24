'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ADMIN_NAV } from '@/config/adminNav'

function isCurrent(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function MenuItems({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
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
              className={`flex min-h-11 items-center rounded-lg px-3 font-bold ${
                current ? 'bg-brand text-white' : 'text-ink active:bg-line'
              }`}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function AdminMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-deep px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-white md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-label="Mở menu quản trị"
          onClick={() => setOpen((value) => !value)}
          className="flex size-11 items-center justify-center rounded-lg text-2xl"
        >
          ☰
        </button>
        <span className="font-black">Quản trị CLR</span>
        <Link href="/" className="ml-auto text-sm">
          ← App
        </Link>
      </header>
      {open && (
        <div className="fixed inset-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-10 bg-white p-3 md:hidden">
          <MenuItems onNavigate={close} />
        </div>
      )}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white p-3 md:block">
        <p className="px-3 py-2 text-lg font-black">Quản trị CLR</p>
        <MenuItems onNavigate={close} />
        <Link href="/" className="mt-4 flex min-h-11 items-center px-3 text-sm text-muted">
          ← Về app
        </Link>
      </aside>
    </>
  )
}
