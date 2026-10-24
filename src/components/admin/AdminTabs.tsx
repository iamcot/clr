import Link from 'next/link'

export type AdminTabItem = { href: string; label: string; active: boolean }

export default function AdminTabs({ items }: { items: AdminTabItem[] }) {
  return (
    <nav className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/70 p-1 ring-1 ring-hairline">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={`flex min-h-9 shrink-0 items-center rounded-full px-4 text-sm font-bold ${
            item.active ? 'bg-white text-ink shadow-sm ring-1 ring-hairline' : 'text-muted md:hover:text-ink'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
