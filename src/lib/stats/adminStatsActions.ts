'use server'

import { revalidatePath } from 'next/cache'
import { requireBcn } from '@/lib/auth/requireBcn'
import { recomputeAllStats } from '@/lib/stats/refreshStats'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

export async function recomputeStatsAndLevels(): Promise<ActionResult> {
  await requireBcn()
  try {
    const result = await recomputeAllStats(createSupabaseServiceClient())
    revalidatePath('/admin/stats')
    return actionSuccess(`Đã tính lại cho ${result.membersRefreshed} thành viên`)
  } catch (error) {
    console.error('Không tính lại được thống kê', error)
    return actionError('Không tính lại được, vui lòng thử lại')
  }
}
