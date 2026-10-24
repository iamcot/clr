'use server'

import { revalidatePath } from 'next/cache'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

const REASON_MAX_LENGTH = 200

export async function setActivityFlag(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const activityId = Number(formData.get('activity_id'))
  const flagged = formData.get('flagged') === 'true'
  const reason = String(formData.get('reason') ?? '')
    .trim()
    .slice(0, REASON_MAX_LENGTH)
  if (!Number.isSafeInteger(activityId)) return actionError('Hoạt động không hợp lệ')
  if (flagged && !reason) return actionError('Cần nhập lý do')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('set_activity_flag', {
    p_activity_id: activityId,
    p_flagged: flagged,
    p_reason: flagged ? reason : null,
  })
  if (error) return actionError('Không đánh dấu được hoạt động, vui lòng thử lại')
  revalidatePath('/admin/activities')
  return actionSuccess(flagged ? 'Đã đánh dấu không hợp lệ' : 'Đã bỏ đánh dấu')
}

export async function retryStravaEvent(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const eventId = Number(formData.get('event_id'))
  if (!Number.isSafeInteger(eventId)) return actionError('Event không hợp lệ')

  const { error } = await createSupabaseServiceClient()
    .from('strava_events')
    .update({ attempts: 0, error: null, next_attempt_at: new Date().toISOString() })
    .eq('id', eventId)
  if (error) return actionError('Không đặt lại được event, vui lòng thử lại')
  revalidatePath('/admin/sync')
  return actionSuccess('Đã đưa event vào hàng đợi thử lại')
}
