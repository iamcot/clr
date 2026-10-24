import Link from 'next/link'
import HomeSummaryCard from '@/components/HomeSummaryCard'
import InstallPrompt from '@/components/InstallPrompt'
import PostCard from '@/components/PostCard'
import PostFeed from '@/components/PostFeed'
import UnpaidFundBanner from '@/components/UnpaidFundBanner'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatFixed } from '@/lib/format/number'
import { formatWeekdayDate, givenName, greetingAt } from '@/lib/home/greeting'
import { loadHomeSummary } from '@/lib/home/loadHomeSummary'
import { loadFriendFeed } from '@/lib/members/friendFeed'
import { loadFeedPage, loadPinnedPosts } from '@/lib/posts/loadFeed'

export default async function HomePage() {
  const member = await requireActiveMember()
  const now = new Date()
  const pinned = await loadPinnedPosts(member.id, now)
  const pinnedIds = pinned.map((post) => post.id)
  const [summary, feed, friendActivities] = await Promise.all([
    loadHomeSummary(member, now),
    loadFeedPage(member.id, now, null, pinnedIds),
    loadFriendFeed(member.id),
  ])

  return (
    <section>
      <InstallPrompt />
      <p className="text-sm text-muted">{formatWeekdayDate(now)}</p>
      <h1 className="mb-4 truncate text-xl font-bold">
        {greetingAt(now)}, {givenName(member.display_name)}
      </h1>
      <HomeSummaryCard summary={summary} />
      {summary.unpaidAmount > 0 && <UnpaidFundBanner amount={summary.unpaidAmount} reason={summary.unpaidReason} />}
      <div className="mt-2 flex flex-wrap gap-x-4">
        <Link href="/members" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Danh bạ thành viên
        </Link>
        <Link href="/rankings" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Bảng xếp hạng
        </Link>
        <Link href="/hall-of-fame" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Bảng vàng
        </Link>
        <Link href="/draws" className="flex min-h-11 items-center font-bold text-brand-dark underline">
          Quay số
        </Link>
      </div>
      {pinned.length > 0 && (
        <>
          <h2 className="mt-4 text-xl font-black">Tin ghim</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {pinned.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-6 text-xl font-black">Bảng tin</h2>
      <div className="mt-3">
        <PostFeed pinnedIds={pinnedIds} initialPosts={feed.posts} initialCursor={feed.nextCursor} />
      </div>
      {friendActivities.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-black">Bạn bè gần đây</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {friendActivities.map((activity) => (
              <li key={activity.id} className="rounded-2xl border border-line bg-white shadow-sm p-3 text-sm">
                <span className="font-bold">{activity.friendName}</span> chạy{' '}
                {formatFixed(activity.distanceMeters / 1000, 2)} km
                <span className="block text-muted">{formatDateTimeVi(activity.startDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
