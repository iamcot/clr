'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import PostCard from '@/components/PostCard'
import { loadMoreFeed } from '@/lib/posts/memberActions'
import type { FeedPostView } from '@/lib/posts/loadFeed'

type PostFeedProps = {
  pinned: FeedPostView[]
  initialPosts: FeedPostView[]
  initialCursor: string | null
}

export default function PostFeed({ pinned, initialPosts, initialCursor }: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, startLoading] = useTransition()
  const sentinel = useRef<HTMLDivElement>(null)

  function loadMore() {
    if (!cursor || loading) return
    startLoading(async () => {
      const page = await loadMoreFeed(
        cursor,
        pinned.map((post) => post.id),
      )
      setPosts((current) => [...current, ...page.posts])
      setCursor(page.nextCursor)
    })
  }

  useEffect(() => {
    const element = sentinel.current
    if (!element || !cursor) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    })
    observer.observe(element)
    return () => observer.disconnect()
    // loadMore đọc cursor và loading mới nhất qua closure của lần render này
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, loading])

  const visible = [...pinned, ...posts]
  return (
    <div>
      {visible.length === 0 && <p className="text-sm text-muted">Chưa có bài viết nào.</p>}
      <ul className="flex flex-col gap-3">
        {visible.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ul>
      {cursor && (
        <div ref={sentinel} className="mt-3">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="min-h-11 w-full rounded-lg border border-line bg-white font-bold"
          >
            {loading ? 'Đang tải...' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  )
}
