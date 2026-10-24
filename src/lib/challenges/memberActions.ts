'use server'

import { revalidatePath } from 'next/cache'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { recomputeChallengesForMember } from '@/lib/challenges/recompute'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

export async function joinChallenge(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const challengeId = String(formData.get('challenge_id') ?? '')
  const supabase = await createSupabaseServerClient()

  const picked = await supabase.rpc('pick_challenge_category', {
    p_challenge_id: challengeId,
    p_gender: member.gender ?? '',
    p_member_type: member.member_type ?? '',
  })
  if (picked.error || !picked.data) return actionError('Không có hạng mục phù hợp với bạn')

  const joined = await supabase.rpc('join_challenge', {
    p_challenge_id: challengeId,
    p_category_id: picked.data,
  })
  if (joined.error) return actionError(joined.error.message.length < 80 ? joined.error.message : 'Không tham gia được')

  await recomputeChallengesForMember(createSupabaseServiceClient(), member.id)
  revalidatePath(`/challenges/${challengeId}`)
  revalidatePath('/challenges')
  return actionSuccess('Đã tham gia challenge')
}
