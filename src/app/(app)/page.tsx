import Link from 'next/link'
import HomeSummaryCard from '@/components/HomeSummaryCard'
import InstallPrompt from '@/components/InstallPrompt'
import PostFeed from '@/components/PostFeed'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadHomeSummary } from '@/lib/home/loadHomeSummary'
import { loadFeedPage, loadPinnedPosts } from '@/lib/posts/loadFeed'
import { loadFriendFeed } from '@/lib/members/friendFeed'
import { formatDateTimeVi } from '@/lib/format/dateTime'

export default async function HomePage() {
  const member = await requireActiveMember()
  const now = new Date()
  const pinned = await loadPinnedPosts(member.id, now)
  const [summary, feed, friendActivities] = await Promise.all([
    loadHomeSummary(member.id, now),
    loadFeedPage(
      member.id,
      now,
      null,
      pinned.map((post) => post.id),
    ),
    loadFriendFeed(member.id),
  ])

  return (
    <section>
      <InstallPrompt />
      <HomeSummaryCard summary={summary} />
      <div className="mt-3 flex gap-4">
        <Link href="/members" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Danh bạ thành viên
        </Link>
        <Link href="/rankings" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Bảng xếp hạng
        </Link>
      </div>
      <h2 className="mt-4 text-lg font-black">Bảng tin</h2>
      <div className="mt-2">
        <PostFeed pinned={pinned} initialPosts={feed.posts} initialCursor={feed.nextCursor} />
      </div>
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
