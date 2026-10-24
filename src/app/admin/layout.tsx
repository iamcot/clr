import Link from 'next/link'
import { ADMIN_LINKS } from '@/config/adminNav'
import { requireBcn } from '@/lib/auth/requireBcn'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireBcn()

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-page px-4 py-4">
      <nav className="mb-4 flex flex-wrap gap-4 border-b border-line pb-3">
        <Link href="/" className="font-bold text-muted">
          ← App
        </Link>
        {ADMIN_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="font-bold text-brand-dark">
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
