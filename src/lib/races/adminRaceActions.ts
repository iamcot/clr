'use server'

import { revalidatePath } from 'next/cache'
import { requireBcn } from '@/lib/auth/requireBcn'
import { announceClubRecordIfNew, type AnnounceOutcome } from '@/lib/hallOfFame/announceRecord'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

const RECORD_OUTCOME_TEXT: Record<AnnounceOutcome, string> = {
  posted: 'Đã xác minh. Đây là kỷ lục CLB mới, đã đăng bài chúc mừng',
  already_posted: 'Đã xác minh. Kỷ lục này đã có bài chúc mừng',
  record: 'Đã xác minh',
  result_missing: 'Đã xác minh',
  no_gender: 'Đã xác minh. Chưa xét kỷ lục vì thành viên chưa khai giới tính',
  unknown_distance: 'Đã xác minh. Cự ly này không thuộc nhóm kỷ lục',
  not_faster: 'Đã xác minh. Chưa nhanh hơn kỷ lục hiện tại',
}

async function describeRecordOutcome(resultId: string): Promise<string> {
  try {
    return RECORD_OUTCOME_TEXT[await announceClubRecordIfNew(resultId)]
  } catch (error) {
    console.error('Không đăng được bài kỷ lục', error)
    return 'Đã xác minh, nhưng không đăng được bài chúc mừng kỷ lục'
  }
}

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

  revalidatePath('/hall-of-fame')
  revalidatePath('/admin/races')
  if (!verified) return actionSuccess('Đã bỏ xác minh')
  return actionSuccess(await describeRecordOutcome(resultId))
}
