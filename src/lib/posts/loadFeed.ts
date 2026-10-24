import 'server-only'
import { FEED_PAGE_SIZE, MAX_PINNED_POSTS, POST_EXCERPT_LENGTH, type PostKind, type ReactionCode } from '@/config/posts'
import { makeExcerpt } from '@/lib/markdown/excerpt'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type FeedPostView = {
  id: string
  kind: PostKind
  title: string
  excerpt: string
  coverUrl: string | null
  pinned: boolean
  requireAck: boolean
  acked: boolean
  publishedAt: string
  reactionCount: number
  commentCount: number
  myReaction: ReactionCode | null
}

export type FeedPage = { posts: FeedPostView[]; nextCursor: string | null }

const FEED_COLUMNS =
  'id, kind, title, body_md, cover_url, pinned, pinned_until, require_ack, published_at, post_reactions(count), post_comments(count)'

type FeedRow = {
  id: string
  kind: string
  title: string
  body_md: string
  cover_url: string | null
  pinned: boolean
  require_ack: boolean
  published_at: string | null
  post_reactions: { count: number }[]
  post_comments: { count: number }[]
}

async function loadMemberMarks(postIds: string[], memberId: string | null) {
  if (!memberId || postIds.length === 0) return { reactions: new Map<string, ReactionCode>(), acked: new Set<string>() }
  const supabase = await createSupabaseServerClient()
  const [reactions, reads] = await Promise.all([
    supabase.from('post_reactions').select('post_id, emoji').eq('member_id', memberId).in('post_id', postIds),
    supabase.from('post_reads').select('post_id, acked_at').eq('member_id', memberId).in('post_id', postIds),
  ])
  return {
    reactions: new Map((reactions.data ?? []).map((row) => [row.post_id, row.emoji as ReactionCode])),
    acked: new Set((reads.data ?? []).filter((row) => row.acked_at !== null).map((row) => row.post_id)),
  }
}

async function toViews(rows: FeedRow[], memberId: string | null): Promise<FeedPostView[]> {
  const marks = await loadMemberMarks(
    rows.map((row) => row.id),
    memberId,
  )
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as PostKind,
    title: row.title,
    excerpt: makeExcerpt(row.body_md, POST_EXCERPT_LENGTH),
    coverUrl: row.cover_url,
    pinned: row.pinned,
    requireAck: row.require_ack,
    acked: marks.acked.has(row.id),
    publishedAt: row.published_at ?? '',
    reactionCount: row.post_reactions[0]?.count ?? 0,
    commentCount: row.post_comments[0]?.count ?? 0,
    myReaction: marks.reactions.get(row.id) ?? null,
  }))
}

// BCN đọc được cả bản nháp, bài hẹn giờ và bài đã xoá qua RLS nên bộ lọc hiển thị phải viết rõ ở đây
export async function loadPinnedPosts(memberId: string | null, now: Date): Promise<FeedPostView[]> {
  const supabase = await createSupabaseServerClient()
  const nowIso = now.toISOString()
  const { data } = await supabase
    .from('posts')
    .select(FEED_COLUMNS)
    .is('deleted_at', null)
    .is('post_comments.deleted_at', null)
    .lte('published_at', nowIso)
    .eq('pinned', true)
    .or(`pinned_until.is.null,pinned_until.gt.${nowIso}`)
    .order('published_at', { ascending: false })
    .limit(MAX_PINNED_POSTS)
  return toViews((data ?? []) as FeedRow[], memberId)
}

export async function loadFeedPage(
  memberId: string | null,
  now: Date,
  cursor: string | null,
  pinnedIds: string[],
): Promise<FeedPage> {
  const supabase = await createSupabaseServerClient()
  const nowIso = now.toISOString()
  let query = supabase
    .from('posts')
    .select(FEED_COLUMNS)
    .is('deleted_at', null)
    .is('post_comments.deleted_at', null)
    .lte('published_at', nowIso)
    .order('published_at', { ascending: false })
    .limit(FEED_PAGE_SIZE + 1)
  if (cursor) query = query.lt('published_at', cursor)
  if (pinnedIds.length > 0) query = query.not('id', 'in', `(${pinnedIds.join(',')})`)

  const { data } = await query
  const rows = (data ?? []) as FeedRow[]
  const pageRows = rows.slice(0, FEED_PAGE_SIZE)
  const last = pageRows[pageRows.length - 1]
  const nextCursor = rows.length > FEED_PAGE_SIZE && last?.published_at ? last.published_at : null
  return { posts: await toViews(pageRows, memberId), nextCursor }
}
