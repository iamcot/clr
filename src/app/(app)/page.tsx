import Link from 'next/link'
import { UpcomingEventCard } from '@/components/EventCardView'
import HomeFeed from '@/components/HomeFeed'
import HomeQuickLinks from '@/components/HomeQuickLinks'
import HomeSummaryCard from '@/components/HomeSummaryCard'
import InstallPrompt from '@/components/InstallPrompt'
import PostCard from '@/components/PostCard'
import UnpaidFundBanner from '@/components/UnpaidFundBanner'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { HOME_EVENT_LIMIT } from '@/config/members'
import { pickHomeEvents } from '@/lib/events/eventTime'
import { loadEventCards } from '@/lib/events/loadEvents'
import { formatWeekdayDate, givenName, greetingAt } from '@/lib/home/greeting'
import { loadHomeSummary } from '@/lib/home/loadHomeSummary'
import { loadHomeFeedPage } from '@/lib/feed/loadHomeFeed'
import { loadPinnedPosts } from '@/lib/posts/loadFeed'

export default async function HomePage() {
  const member = await requireActiveMember()
  const now = new Date()
  const pinned = await loadPinnedPosts(member.id, now)
  const pinnedIds = pinned.map((post) => post.id)
  const [summary, feed, eventCards] = await Promise.all([
    loadHomeSummary(member, now),
    loadHomeFeedPage(member.id, now, null, pinnedIds),
    loadEventCards(member.id),
  ])
  const homeEvents = pickHomeEvents(eventCards, now, HOME_EVENT_LIMIT)

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
      {homeEvents.events.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">{homeEvents.ongoing ? 'Event đang diễn ra' : 'Event sắp diễn ra'}</h2>
            <Link href="/events" className="flex min-h-11 items-center font-bold text-brand-dark">
              Xem tất cả
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {homeEvents.events.map((event) => (
              <UpcomingEventCard key={event.id} event={event} now={now} />
            ))}
          </ul>
        </div>
      )}
      <h2 className="mt-6 text-xl font-black">Bảng tin</h2>
      <div className="mt-3">
        <HomeFeed pinnedIds={pinnedIds} initial={feed} />
      </div>
    </section>
  )
}
