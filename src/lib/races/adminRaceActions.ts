'use server'

import { revalidatePath } from 'next/cache'
import { requireBcn } from '@/lib/auth/requireBcn'
import { announceClubRecordIfNew } from '@/lib/hallOfFame/announceRecord'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

export async function verifyRaceResult(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const verified = formData.get('verified') === 'true'
  const resultId = String(formData.get('result_id') ?? '')
  const { error } = await supabase.rpc('admin_verify_race_result', {
    p_result_id: resultId,
    p_verified: verified,
  })
  if (error) return actionError('Không cập nhật được, vui lòng thử lại')

  if (verified) await announceClubRecordIfNew(resultId).catch(() => undefined)
  revalidatePath('/hall-of-fame')
  revalidatePath('/admin/races')
  return actionSuccess(verified ? 'Đã xác minh kết quả' : 'Đã bỏ xác minh')
}
