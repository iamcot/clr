import AdminMenu from '@/components/AdminMenu'
import { requireBcn } from '@/lib/auth/requireBcn'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireBcn()

  return (
    <div className="min-h-dvh bg-page md:flex">
      <AdminMenu />
      <main className="mx-auto w-full max-w-4xl px-4 py-4">{children}</main>
    </div>
  )
}
