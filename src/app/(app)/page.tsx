import Link from 'next/link'
import { UpcomingEventCard } from '@/components/EventCardView'
import FollowingHighlights from '@/components/FollowingHighlights'
import HomeQuickLinks from '@/components/HomeQuickLinks'
import HomeSummaryCard from '@/components/HomeSummaryCard'
import InstallPrompt from '@/components/InstallPrompt'
import PostCard from '@/components/PostCard'
import PostFeed from '@/components/PostFeed'
import UnpaidFundBanner from '@/components/UnpaidFundBanner'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { HOME_EVENT_LIMIT } from '@/config/members'
import { splitUpcomingAndPast } from '@/lib/events/eventTime'
import { loadEventCards } from '@/lib/events/loadEvents'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { formatFixed } from '@/lib/format/number'
import { formatWeekdayDate, givenName, greetingAt } from '@/lib/home/greeting'
import { loadHomeSummary } from '@/lib/home/loadHomeSummary'
import { loadFriendFeed } from '@/lib/members/friendFeed'
import { loadFollowingHighlights } from '@/lib/members/followingHighlights'
import { loadFeedPage, loadPinnedPosts } from '@/lib/posts/loadFeed'

export default async function HomePage() {
  const member = await requireActiveMember()
  const now = new Date()
  const pinned = await loadPinnedPosts(member.id, now)
  const pinnedIds = pinned.map((post) => post.id)
  const [summary, feed, friendActivities, eventCards, highlights] = await Promise.all([
    loadHomeSummary(member, now),
    loadFeedPage(member.id, now, null, pinnedIds),
    loadFriendFeed(member.id),
    loadEventCards(member.id),
    loadFollowingHighlights(member.id, now),
  ])
  const upcomingEvents = splitUpcomingAndPast(eventCards, now).upcoming.slice(0, HOME_EVENT_LIMIT)

  return (
    <section>
      <InstallPrompt />
      <p className="text-sm text-muted">{formatWeekdayDate(now)}</p>
      <h1 className="mb-4 truncate text-xl font-bold">
        {greetingAt(now)}, {givenName(member.display_name)}
      </h1>
      <HomeSummaryCard summary={summary} />
      {summary.unpaidAmount > 0 && <UnpaidFundBanner amount={summary.unpaidAmount} reason={summary.unpaidReason} />}
      <HomeQuickLinks />
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
      {upcomingEvents.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Event sắp diễn ra</h2>
            <Link href="/events" className="flex min-h-11 items-center font-bold text-brand-dark">
              Xem tất cả
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {upcomingEvents.map((event) => (
              <UpcomingEventCard key={event.id} event={event} now={now} />
            ))}
          </ul>
        </div>
      )}
      <FollowingHighlights items={highlights} now={now} />
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
