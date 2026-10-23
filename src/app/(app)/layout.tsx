import Image from 'next/image'
import AppTabs from '@/components/AppTabs'
import { requireActiveMember } from '@/lib/auth/currentMember'

function AppHeader() {
  return (
    <header className="flex items-center gap-2 bg-deep px-4 py-3 text-white">
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={32} height={32} className="rounded-full" />
      <span className="text-lg font-black tracking-wide">CLR</span>
    </header>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireActiveMember()

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-page shadow-sm">
      <AppHeader />
      <main className="px-4 pt-4 pb-24">{children}</main>
      <AppTabs />
    </div>
  )
}
