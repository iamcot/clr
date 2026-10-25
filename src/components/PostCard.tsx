'use client'

import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { CommentIcon, HeartIcon } from '@/components/PostIcons'
import { POST_KIND_LABELS, type PostKind } from '@/config/posts'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatRelativeVi } from '@/lib/format/relativeTime'
import { acknowledgePost } from '@/lib/posts/memberActions'
import type { FeedPostView } from '@/lib/posts/loadFeed'

const KIND_BADGE_STYLES: Record<PostKind, string> = {
  announcement: 'bg-brand/10 text-brand-dark',
  result: 'bg-gold text-deep',
  event: 'bg-lime/30 text-brand-dark',
  system: 'bg-line text-muted',
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PublishedAt({ iso }: { iso: string }) {
  const text = formatRelativeVi(iso, new Date()) ?? formatDateVi(iso)
  return (
    <span className="text-xs text-muted" suppressHydrationWarning>
      {text}
    </span>
  )
}

function PostHeading({ post }: { post: FeedPostView }) {
  if (post.pinned) {
    const label = post.requireAck ? 'Thông báo quan trọng' : POST_KIND_LABELS[post.kind]
    return (
      <p className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
        <PinIcon />
        BCN · {label}
      </p>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${KIND_BADGE_STYLES[post.kind]}`}>
        {POST_KIND_LABELS[post.kind]}
      </span>
      <PublishedAt iso={post.publishedAt} />
    </div>
  )
}

function AckSection({ post }: { post: FeedPostView }) {
  if (post.acked) return <p className="px-4 pb-4 text-sm font-bold text-brand-dark">✓ Bạn đã đọc và đồng ý</p>
  return (
    <div className="px-4 pb-4">
      <ActionForm action={acknowledgePost}>
        <input type="hidden" name="post_id" value={post.id} />
        <button
          type="submit"
          className="min-h-12 rounded-full bg-brand px-6 font-bold text-white active:bg-brand-dark"
        >
          Đã đọc và đồng ý
        </button>
      </ActionForm>
    </div>
  )
}

export default function PostCard({ post, memberView }: { post: FeedPostView; memberView: boolean }) {
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Link href={`/posts/${post.id}`} className="block active:bg-page">
        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa là link ngoài do BCN dán, chưa có kho ảnh để cấu hình next/image
          <img src={post.coverUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
        )}
        <div className="p-4">
          <PostHeading post={post} />
          <p className="mt-3 text-xl leading-snug font-black">{post.title}</p>
          {post.excerpt && <p className="mt-2 text-muted">{post.excerpt}</p>}
          {!post.pinned && memberView && (
            <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <HeartIcon />
                {post.reactionCount}
              </span>
              <span className="flex items-center gap-1.5">
                <CommentIcon />
                {post.commentCount}
              </span>
              <span className="ml-auto font-bold text-brand-dark">Xem chi tiết</span>
            </div>
          )}
        </div>
      </Link>
      {post.requireAck && memberView && <AckSection post={post} />}
    </li>
  )
}
