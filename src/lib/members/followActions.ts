'use server'

import { revalidatePath } from 'next/cache'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

export async function setFollow(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const followeeId = String(formData.get('member_id') ?? '')
  const follow = formData.get('follow') === 'true'
  if (!followeeId || followeeId === member.id) return actionError('Không theo dõi được người này')

  const supabase = await createSupabaseServerClient()
  const { error } = follow
    ? await supabase.from('follows').upsert({ follower_id: member.id, followee_id: followeeId }, { ignoreDuplicates: true })
    : await supabase.from('follows').delete().eq('follower_id', member.id).eq('followee_id', followeeId)
  if (error) return actionError('Không cập nhật được, vui lòng thử lại')

  revalidatePath('/members')
  revalidatePath(`/members/${followeeId}`)
  revalidatePath('/')
  return actionSuccess(follow ? 'Đã theo dõi' : 'Đã bỏ theo dõi')
}
