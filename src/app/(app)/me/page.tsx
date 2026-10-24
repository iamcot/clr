import Link from 'next/link'
import { requireActiveMember } from '@/lib/auth/currentMember'
import RecentActivities from '@/components/RecentActivities'
import { loadOwnRecentActivities } from '@/lib/strava/recentActivities'
import { getBackfillStatusText } from '@/lib/strava/syncStatus'

export default async function MePage() {
  const member = await requireActiveMember()
  const [backfillStatus, activities] = await Promise.all([
    getBackfillStatusText(member.id),
    loadOwnRecentActivities(member.id),
  ])

  return (
    <section>
      <h1 className="text-2xl font-black">Tôi</h1>
      <p className="mt-2 text-muted">Hồ sơ cá nhân đang được xây dựng.</p>
      {backfillStatus && <p className="mt-4 rounded-lg bg-white p-3 text-sm text-muted">{backfillStatus}</p>}
      <RecentActivities activities={activities} />
      <Link href="/me/settings" className="mt-6 flex min-h-11 items-center font-bold text-brand-dark underline">
        Cài đặt hồ sơ
      </Link>
      {member.role === 'bcn' && (
        <Link href="/admin" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Trang quản trị BCN
        </Link>
      )}
      <form action="/api/auth/logout" method="post" className="mt-2">
        <button type="submit" className="min-h-11 rounded-lg border border-line px-4 font-bold">
          Đăng xuất
        </button>
      </form>
    </section>
  )
}
