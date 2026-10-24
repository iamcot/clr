'use server'

import { revalidatePath } from 'next/cache'
import { FIRST_MARATHON_MIN_METERS, MILESTONES_KM } from '@/config/hallOfFame'
import { requireBcn } from '@/lib/auth/requireBcn'
import { parseSpecialHonor } from '@/lib/hallOfFame/specialHonorInput'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

function refreshPages() {
  revalidatePath('/admin/honors')
  revalidatePath('/hall-of-fame')
}

export async function generateHonors(): Promise<ActionResult> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('generate_honors', {
    p_milestones_km: [...MILESTONES_KM],
    p_first_marathon_min_m: FIRST_MARATHON_MIN_METERS,
  })
  if (error) return actionError('Không quét được danh hiệu, vui lòng thử lại')
  refreshPages()
  return actionSuccess(data > 0 ? `Có ${data} danh hiệu mới chờ duyệt` : 'Không có danh hiệu mới')
}

export async function setHonorApproved(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const approved = formData.get('approved') === 'true'
  const { error } = await supabase
    .from('honors')
    .update({ approved })
    .eq('id', String(formData.get('honor_id') ?? ''))
  if (error) return actionError('Không cập nhật được, vui lòng thử lại')
  refreshPages()
  return actionSuccess(approved ? 'Đã duyệt danh hiệu' : 'Đã ẩn danh hiệu')
}

export async function deleteHonor(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('honors').delete().eq('id', String(formData.get('honor_id') ?? ''))
  if (error) return actionError('Không xoá được, vui lòng thử lại')
  refreshPages()
  return actionSuccess('Đã xoá danh hiệu')
}

export async function addSpecialHonor(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const parsed = parseSpecialHonor(formData)
  if (!parsed.ok) return actionError(parsed.message)
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('honors').insert({
    member_id: parsed.value.memberId,
    kind: 'special',
    title: parsed.value.title,
    detail: parsed.value.detail,
    honor_date: parsed.value.date,
    image_url: parsed.value.imageUrl,
    approved: true,
    created_by: bcn.id,
  })
  if (error) return actionError('Không thêm được danh hiệu, vui lòng thử lại')
  refreshPages()
  return actionSuccess('Đã thêm danh hiệu')
}
