'use client'

import { useState, useTransition } from 'react'
import FeedEntryCard from '@/components/FeedEntryCard'
import type { FeedEntry, HomeFeedPage } from '@/lib/feed/mergeFeed'
import { loadMoreFeed } from '@/lib/posts/memberActions'

type HomeFeedProps = { pinnedIds: string[]; initial: HomeFeedPage }

export default function HomeFeed({ pinnedIds, initial }: HomeFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>(initial.entries)
  const [cursor, setCursor] = useState(initial.nextCursor)
  const [loading, startLoading] = useTransition()

  function loadMore() {
    if (!cursor || loading) return
    startLoading(async () => {
      const page = await loadMoreFeed(cursor, pinnedIds)
      setEntries((current) => [...current, ...page.entries.filter((entry) => !current.some((item) => item.id === entry.id))])
      setCursor(page.nextCursor)
    })
  }

  return (
    <div>
      {entries.length === 0 && <p className="text-sm text-muted">Chưa có gì trong bảng tin.</p>}
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <FeedEntryCard key={entry.id} entry={entry} />
        ))}
      </ul>
      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-3 min-h-11 w-full rounded-lg border border-line bg-white font-bold"
        >
          {loading ? 'Đang tải...' : 'Xem thêm'}
        </button>
      )}
    </div>
  )
}
