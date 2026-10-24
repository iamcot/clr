import 'server-only'
import { COMMENT_LIST_LIMIT, type PostKind, type ReactionCode } from '@/config/posts'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PostDetail = {
  id: string
  kind: PostKind
  title: string
  bodyMd: string
  coverUrl: string | null
  requireAck: boolean
  publishedAt: string
  authorName: string | null
  acked: boolean
  myReaction: ReactionCode | null
  reactionCounts: Partial<Record<ReactionCode, number>>
}

export type CommentView = {
  id: string
  memberId: string
  authorName: string
  body: string
  parentId: string | null
  createdAt: string
}

export async function loadPostDetail(postId: string, memberId: string | null, now: Date): Promise<PostDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data: post } = await supabase
    .from('posts')
    .select('id, kind, title, body_md, cover_url, require_ack, published_at, author_id')
    .eq('id', postId)
    .is('deleted_at', null)
    .lte('published_at', now.toISOString())
    .maybeSingle()
  if (!post) return null

  const [reactions, read, author] = await Promise.all([
    memberId
      ? supabase.from('post_reactions').select('member_id, emoji').eq('post_id', postId)
      : Promise.resolve({ data: [] as { member_id: string; emoji: string }[] }),
    memberId
      ? supabase.from('post_reads').select('acked_at').eq('post_id', postId).eq('member_id', memberId).maybeSingle()
      : Promise.resolve({ data: null }),
    post.author_id
      ? supabase.from('members_public').select('display_name').eq('id', post.author_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const counts: Partial<Record<ReactionCode, number>> = {}
  for (const row of reactions.data ?? []) {
    const code = row.emoji as ReactionCode
    counts[code] = (counts[code] ?? 0) + 1
  }
  return {
    id: post.id,
    kind: post.kind as PostKind,
    title: post.title,
    bodyMd: post.body_md,
    coverUrl: post.cover_url,
    requireAck: post.require_ack,
    publishedAt: post.published_at ?? '',
    authorName: author.data?.display_name ?? null,
    acked: read.data?.acked_at != null,
    myReaction:
      ((reactions.data ?? []).find((row) => row.member_id === memberId)?.emoji as ReactionCode | null) ?? null,
    reactionCounts: counts,
  }
}

export async function loadComments(postId: string): Promise<CommentView[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('post_comments')
    .select('id, member_id, body, parent_id, created_at')
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at')
    .limit(COMMENT_LIST_LIMIT)
  const rows = data ?? []
  const ids = [...new Set(rows.map((row) => row.member_id))]
  const names = new Map<string, string>()
  if (ids.length > 0) {
    const { data: people } = await supabase.from('members_public').select('id, display_name').in('id', ids)
    for (const person of people ?? []) names.set(person.id, person.display_name ?? 'Thành viên')
  }
  return rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    authorName: names.get(row.member_id) ?? 'Thành viên',
    body: row.body,
    parentId: row.parent_id,
    createdAt: row.created_at,
  }))
}

export async function countUnreadPosts(): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('unread_post_count')
  return data ?? 0
}
