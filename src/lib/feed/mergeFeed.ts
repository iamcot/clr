import type { HighlightItem } from '@/lib/members/highlights'
import type { FeedPostView } from '@/lib/posts/loadFeed'

export type FeedEntry =
  | { kind: 'post'; id: string; at: string; post: FeedPostView }
  | { kind: 'highlight'; id: string; at: string; highlight: HighlightItem }

export type FeedSource = { entries: FeedEntry[]; hasMore: boolean }

export type HomeFeedPage = { entries: FeedEntry[]; nextCursor: string | null }

function timeOf(entry: FeedEntry): number {
  return Date.parse(entry.at)
}

function newestFirst(a: FeedEntry, b: FeedEntry): number {
  return timeOf(b) - timeOf(a) || a.id.localeCompare(b.id)
}

// Nguồn còn dữ liệu cũ hơn phần đã tải thì mọi mục cũ hơn mốc đó phải để trang sau, nếu không sẽ chen ngang
// trước những mục chưa tải của nguồn ấy
function cutoffTime(sources: FeedSource[]): number {
  const oldestOfOpenSources = sources
    .filter((source) => source.hasMore && source.entries.length > 0)
    .map((source) => Math.min(...source.entries.map(timeOf)))
  return oldestOfOpenSources.length === 0 ? -Infinity : Math.max(...oldestOfOpenSources)
}

export function mergeFeedSources(sources: FeedSource[], pageSize: number): HomeFeedPage {
  const cutoff = cutoffTime(sources)
  const merged = sources
    .flatMap((source) => source.entries)
    .filter((entry) => timeOf(entry) >= cutoff)
    .sort(newestFirst)
  const entries = merged.slice(0, pageSize)
  const last = entries[entries.length - 1]
  const hasMore = merged.length > pageSize || sources.some((source) => source.hasMore)
  return { entries, nextCursor: hasMore && last ? last.at : null }
}
