import Image from 'next/image'
import { redirect } from 'next/navigation'
import AppTabs from '@/components/AppTabs'
import OfflineBanner from '@/components/OfflineBanner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { countUnreadPosts } from '@/lib/posts/loadPost'

function AppHeader() {
  return (
    <header className="flex items-center gap-2 bg-deep px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-white">
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={32} height={32} className="rounded-full" />
      <span className="text-lg font-black tracking-wide">CLR</span>
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
