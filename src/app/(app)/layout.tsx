import { redirect } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppTabs from '@/components/AppTabs'
import OfflineBanner from '@/components/OfflineBanner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { getViewer } from '@/lib/auth/viewer'
import { countUnreadPosts } from '@/lib/posts/loadPost'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  if (viewer.kind === 'member' && !viewer.member?.profile_onboarded_at) redirect('/welcome')

  const unreadPosts = viewer.kind === 'member' ? await countUnreadPosts() : 0

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-page shadow-sm">
      <AppHeader viewer={viewer} />
      <OfflineBanner />
      <main className="px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <AppTabs homeBadge={unreadPosts} />
      <ServiceWorkerRegister />
    </div>
  )
}
