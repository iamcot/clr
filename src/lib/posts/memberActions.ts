'use server'

import { revalidatePath } from 'next/cache'
import { COMMENT_MAX_LENGTH, HEART_REACTION } from '@/config/posts'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { activeMemberOf, getViewer } from '@/lib/auth/viewer'
import { loadHomeFeedPage } from '@/lib/feed/loadHomeFeed'
import type { HomeFeedPage } from '@/lib/feed/mergeFeed'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function revalidatePost(postId: string) {
  revalidatePath(`/posts/${postId}`)
  revalidatePath('/', 'layout')
}

export async function markPostRead(postId: string): Promise<void> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('post_reads')
    .upsert({ post_id: postId, member_id: member.id }, { onConflict: 'post_id,member_id', ignoreDuplicates: true })
  if (!error) revalidatePath('/', 'layout')
}

export async function acknowledgePost(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const postId = readText(formData, 'post_id')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('post_reads')
    .upsert(
      { post_id: postId, member_id: member.id, acked_at: new Date().toISOString() },
      { onConflict: 'post_id,member_id' },
    )
  if (error) return actionError('Không ghi nhận được, vui lòng thử lại')
  revalidatePost(postId)
  return actionSuccess('Đã ghi nhận bạn đã đọc và đồng ý')
}

// Chọn lại đúng cảm xúc đang có thì bỏ cảm xúc
// Chỉ còn một thao tác thả tim: đã có cảm xúc (kể cả loại cũ) thì bỏ, chưa có thì thả tim
export async function reactToPost(formData: FormData): Promise<ActionResult | void> {
  const member = await requireActiveMember()
  const postId = readText(formData, 'post_id')

  const supabase = await createSupabaseServerClient()
  const current = await supabase
    .from('post_reactions')
    .select('emoji')
    .eq('post_id', postId)
    .eq('member_id', member.id)
    .maybeSingle()
  const { error } = current.data
    ? await supabase.from('post_reactions').delete().eq('post_id', postId).eq('member_id', member.id)
    : await supabase.from('post_reactions').insert({ post_id: postId, member_id: member.id, emoji: HEART_REACTION })
  if (error) return actionError('Không lưu được cảm xúc')
  revalidatePost(postId)
}

export async function addComment(formData: FormData): Promise<ActionResult | void> {
  const member = await requireActiveMember()
  const postId = readText(formData, 'post_id')
  const body = readText(formData, 'body')
  const parentId = readText(formData, 'parent_id') || null
  if (body === '') return actionError('Nhập nội dung bình luận')
  if (body.length > COMMENT_MAX_LENGTH) return actionError(`Bình luận tối đa ${COMMENT_MAX_LENGTH} ký tự`)

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, member_id: member.id, body, parent_id: parentId })
  if (error) return actionError('Không gửi được bình luận')
  revalidatePost(postId)
}

export async function deleteComment(formData: FormData): Promise<ActionResult> {
  await requireActiveMember()
  const postId = readText(formData, 'post_id')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('delete_post_comment', { p_comment_id: readText(formData, 'comment_id') })
  if (error) return actionError('Không xoá được bình luận')
  revalidatePost(postId)
  return actionSuccess('Đã xoá bình luận')
}

export async function loadMoreFeed(cursor: string, pinnedIds: string[]): Promise<HomeFeedPage> {
  const viewer = await getViewer()
  return loadHomeFeedPage(activeMemberOf(viewer)?.id ?? null, new Date(), cursor, pinnedIds)
}
