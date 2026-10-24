'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { MAX_PINNED_POSTS } from '@/config/posts'
import { logAudit } from '@/lib/audit/logAudit'
import { requireBcn } from '@/lib/auth/requireBcn'
import { parsePostInput, resolvePublishedAt, type PostInput } from '@/lib/posts/postInput'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import { setFlashToast } from '@/lib/toast/setFlash'

export type PostFormState = {
  errors: Partial<Record<string, string>>
  values: Record<string, string>
}

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

function readRawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') values[key] = value
  })
  return values
}

async function countOtherActivePins(supabase: Supabase, postId: string | null, now: Date): Promise<number> {
  const nowIso = now.toISOString()
  let query = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('pinned', true)
    .or(`pinned_until.is.null,pinned_until.gt.${nowIso}`)
  if (postId) query = query.neq('id', postId)
  const { count } = await query
  return count ?? 0
}

function postRow(input: PostInput, publishedAt: string | null) {
  return {
    title: input.title,
    body_md: input.bodyMd,
    kind: input.kind,
    cover_url: input.coverUrl,
    pinned: input.pinned,
    pinned_until: input.pinnedUntil,
    require_ack: input.requireAck,
    published_at: publishedAt,
  }
}

export async function savePost(_previous: PostFormState, formData: FormData): Promise<PostFormState> {
  const bcn = await requireBcn()
  const values = readRawValues(formData)
  const parsed = parsePostInput(formData)
  if (!parsed.ok) return { errors: parsed.errors, values }

  const supabase = await createSupabaseServerClient()
  const now = new Date()
  const postId = values.id || null
  if (parsed.value.pinned && (await countOtherActivePins(supabase, postId, now)) >= MAX_PINNED_POSTS) {
    return { errors: { pinned: `Chỉ ghim tối đa ${MAX_PINNED_POSTS} bài cùng lúc` }, values }
  }

  let savedId = postId
  if (postId) {
    const existing = await supabase.from('posts').select('published_at').eq('id', postId).maybeSingle()
    const publishedAt = resolvePublishedAt(parsed.value, now, existing.data?.published_at ?? null)
    const { error } = await supabase.from('posts').update(postRow(parsed.value, publishedAt)).eq('id', postId)
    if (error) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }
  } else {
    const publishedAt = resolvePublishedAt(parsed.value, now, null)
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...postRow(parsed.value, publishedAt), author_id: bcn.id })
      .select('id')
      .single()
    if (error || !data) return { errors: { form: 'Không đăng được, vui lòng thử lại' }, values }
    savedId = data.id
  }
  if (!savedId) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }

  await logAudit({ action: postId ? 'update_post' : 'create_post', targetTable: 'posts', targetId: savedId })
  await setFlashToast('post_saved')
  revalidatePath('/', 'layout')
  redirect(`/admin/posts/${savedId}`)
}

export async function deletePost(formData: FormData): Promise<ActionResult | void> {
  await requireBcn()
  const postId = String(formData.get('post_id') ?? '')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId)
  if (error) return actionError('Không xoá được bài')
  await logAudit({ action: 'delete_post', targetTable: 'posts', targetId: postId })
  revalidatePath('/', 'layout')
  await setFlashToast('post_deleted')
  redirect('/admin/posts')
}

export async function publishDraftNow(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const postId = String(formData.get('post_id') ?? '')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('posts')
    .update({ published_at: new Date().toISOString() })
    .eq('id', postId)
    .is('deleted_at', null)
  if (error) return actionError('Không đăng được bài')
  await logAudit({ action: 'publish_post', targetTable: 'posts', targetId: postId })
  revalidatePath('/', 'layout')
  revalidatePath(`/admin/posts/${postId}`)
  return actionSuccess('Đã đăng bài')
}
