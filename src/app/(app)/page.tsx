import Link from 'next/link'
import InstallPrompt from '@/components/InstallPrompt'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadFriendFeed } from '@/lib/members/friendFeed'

export default async function HomePage() {
  const member = await requireActiveMember()
  const friendActivities = await loadFriendFeed(member.id)

  return (
    <section>
      <InstallPrompt />
      <h1 className="text-2xl font-black">CLR</h1>
      <p className="mt-2 text-muted">Trang chủ đang được xây dựng.</p>
      <Link href="/members" className="mt-4 flex min-h-11 items-center font-bold text-brand-dark underline">
        Danh bạ thành viên
      </Link>
      <Link href="/rankings" className="flex min-h-11 items-center font-bold text-brand-dark underline">
        Bảng xếp hạng
      </Link>
      {friendActivities.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-black">Bạn bè gần đây</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {friendActivities.map((activity) => (
              <li key={activity.id} className="rounded-lg bg-white p-3 text-sm">
                <span className="font-bold">{activity.friendName}</span> chạy{' '}
                {(activity.distanceMeters / 1000).toFixed(2)} km
                <span className="block text-muted">{formatDateTimeVi(activity.startDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
