'use server'

import { revalidatePath } from 'next/cache'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { getBcnMember } from '@/lib/auth/requireBcn'
import { deleteObject, publicUrl } from '@/lib/storage/r2'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

function readId(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '')
}

function revalidateAlbum(eventId: string) {
  revalidatePath(`/events/${eventId}/photos`)
  revalidatePath(`/admin/events/${eventId}/photos`)
  revalidatePath('/photos')
}

export async function tagMyself(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('event_photo_tags')
    .upsert({ photo_id: readId(formData, 'photo_id'), member_id: member.id }, { ignoreDuplicates: true })
  if (error) return actionError('Không gắn tên được')
  revalidateAlbum(readId(formData, 'event_id'))
  return actionSuccess('Đã gắn bạn vào ảnh')
}

export async function untagMyself(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('event_photo_tags')
    .delete()
    .eq('photo_id', readId(formData, 'photo_id'))
    .eq('member_id', member.id)
  if (error) return actionError('Không bỏ gắn tên được')
  revalidateAlbum(readId(formData, 'event_id'))
  return actionSuccess('Đã bỏ gắn tên')
}

// Chủ ảnh hoặc BCN xoá; RLS quyết định ai được xoá, xoá được dòng rồi mới xoá file trên R2
export async function deletePhoto(formData: FormData): Promise<ActionResult> {
  await requireActiveMember()
  const photoId = readId(formData, 'photo_id')
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('event_photos')
    .delete()
    .eq('id', photoId)
    .select('event_id, object_key, thumb_key')
    .maybeSingle()
  if (!data) return actionError('Không xoá được ảnh')
  await Promise.all([deleteObject(data.object_key), deleteObject(data.thumb_key)])
  revalidateAlbum(data.event_id)
  return actionSuccess('Đã xoá ảnh')
}

export async function setPhotoHidden(formData: FormData): Promise<ActionResult> {
  if (!(await getBcnMember())) return actionError('Chỉ BCN được ẩn ảnh')
  const supabase = await createSupabaseServerClient()
  const hidden = readId(formData, 'hidden') === '1'
  const { data, error } = await supabase
    .from('event_photos')
    .update({ hidden })
    .eq('id', readId(formData, 'photo_id'))
    .select('event_id')
    .maybeSingle()
  if (error || !data) return actionError('Không cập nhật được ảnh')
  revalidateAlbum(data.event_id)
  return actionSuccess(hidden ? 'Đã ẩn ảnh' : 'Đã hiện lại ảnh')
}

export async function setCoverFromPhoto(formData: FormData): Promise<ActionResult> {
  if (!(await getBcnMember())) return actionError('Chỉ BCN được chọn ảnh bìa')
  const supabase = await createSupabaseServerClient()
  const photo = await supabase
    .from('event_photos')
    .select('event_id, object_key')
    .eq('id', readId(formData, 'photo_id'))
    .maybeSingle()
  if (!photo.data) return actionError('Không tìm thấy ảnh')
  const { error } = await supabase
    .from('events')
    .update({ cover_url: publicUrl(photo.data.object_key) })
    .eq('id', photo.data.event_id)
  if (error) return actionError('Không đặt được ảnh bìa')
  revalidatePath('/events')
  revalidatePath(`/events/${photo.data.event_id}`)
  return actionSuccess('Đã đặt làm ảnh bìa event')
}
