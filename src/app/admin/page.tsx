import Link from 'next/link'
import { ADMIN_LINKS } from '@/config/adminNav'

export default function AdminHomePage() {
  return (
    <section>
      <h1 className="text-2xl font-black">Quản trị BCN</h1>
      <ul className="mt-4 flex flex-col gap-3">
        {ADMIN_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-lg bg-white p-4">
              <span className="font-bold text-brand-dark">{link.label}</span>
              <span className="mt-1 block text-sm text-muted">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
