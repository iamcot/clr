import AdminMenu from '@/components/AdminMenu'
import { requireBcn } from '@/lib/auth/requireBcn'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireBcn()

  return (
    <div className="min-h-dvh bg-surface md:flex">
      <AdminMenu />
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] md:px-8 md:pt-7 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  )
}
