'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { disconnectFromStrava } from '@/lib/strava/disconnect'
import { removeStravaData } from '@/lib/strava/localData'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import { setFlashToast } from '@/lib/toast/setFlash'

export async function disconnectStrava(): Promise<ActionResult | void> {
  const member = await requireActiveMember()
  try {
    await disconnectFromStrava(member.id)
  } catch {
    return actionError('Không ngắt được kết nối Strava, vui lòng thử lại')
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  await setFlashToast('strava_disconnected')
  redirect('/login')
}

export async function deleteMyStravaData(): Promise<ActionResult> {
  const member = await requireActiveMember()
  try {
    await removeStravaData(createSupabaseServiceClient(), member.id)
  } catch {
    return actionError('Không xoá được dữ liệu Strava, vui lòng thử lại')
  }
  revalidatePath('/me')
  return actionSuccess('Đã xoá dữ liệu Strava của bạn')
}

export async function saveShareStats(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('members')
    .update({
      share_stats_with_club: formData.get('share_stats_with_club') === 'on',
      share_private_in_totals: formData.get('share_private_in_totals') === 'on',
    })
    .eq('id', member.id)
  if (error) return actionError('Không lưu được, vui lòng thử lại')
  revalidatePath('/me/settings')
  return actionSuccess('Đã lưu tuỳ chọn chia sẻ')
}
