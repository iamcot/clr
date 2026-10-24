import 'server-only'
import { FEED_PAGE_SIZE } from '@/config/posts'
import { mergeFeedSources, type FeedSource, type HomeFeedPage } from '@/lib/feed/mergeFeed'
import { loadFollowingHighlights } from '@/lib/members/followingHighlights'
import { loadFeedPage } from '@/lib/posts/loadFeed'

function isBefore(iso: string, cursor: string | null): boolean {
  return cursor === null || Date.parse(iso) < Date.parse(cursor)
}

async function loadPostSource(memberId: string, now: Date, cursor: string | null, pinnedIds: string[]): Promise<FeedSource> {
  const page = await loadFeedPage(memberId, now, cursor, pinnedIds)
  return {
    entries: page.posts.map((post) => ({ kind: 'post' as const, id: `post-${post.id}`, at: post.publishedAt, post })),
    hasMore: page.nextCursor !== null,
  }
}

async function loadHighlightSource(memberId: string, now: Date, cursor: string | null): Promise<FeedSource> {
  const items = (await loadFollowingHighlights(memberId, now)).filter((item) => isBefore(item.date, cursor))
  return {
    entries: items.slice(0, FEED_PAGE_SIZE).map((highlight) => ({
      kind: 'highlight' as const,
      id: highlight.id,
      at: highlight.date,
      highlight,
    })),
    hasMore: items.length > FEED_PAGE_SIZE,
  }
}

// Bài viết và tin của người đang theo dõi gộp một dòng thời gian, mới nhất trước
export async function loadHomeFeedPage(
  memberId: string,
  now: Date,
  cursor: string | null,
  pinnedIds: string[],
): Promise<HomeFeedPage> {
  const sources = await Promise.all([
    loadPostSource(memberId, now, cursor, pinnedIds),
    loadHighlightSource(memberId, now, cursor),
  ])
  return mergeFeedSources(sources, FEED_PAGE_SIZE)
}
