import Image from 'next/image'
import { redirect } from 'next/navigation'
import AppTabs from '@/components/AppTabs'
import OfflineBanner from '@/components/OfflineBanner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { countUnreadPosts } from '@/lib/posts/loadPost'

function AppHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-white px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-deep">
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={40} height={40} className="rounded-full" />
      <div className="leading-tight">
        <p className="text-lg font-black tracking-wide">CLR</p>
        <p className="text-xs text-muted">Celadon Running Club</p>
      </div>
    </header>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireActiveMember()
  if (!member.profile_onboarded_at) redirect('/welcome')

  const unreadPosts = await countUnreadPosts()

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-page shadow-sm">
      <AppHeader />
      <OfflineBanner />
      <main className="px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <AppTabs homeBadge={unreadPosts} />
      <ServiceWorkerRegister />
    </div>
  )
}
