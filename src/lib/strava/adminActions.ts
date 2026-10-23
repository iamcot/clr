'use server'

import { revalidatePath } from 'next/cache'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

const REASON_MAX_LENGTH = 200

export async function setActivityFlag(formData: FormData): Promise<void> {
  await requireBcn()
  const activityId = Number(formData.get('activity_id'))
  const flagged = formData.get('flagged') === 'true'
  const reason = String(formData.get('reason') ?? '')
    .trim()
    .slice(0, REASON_MAX_LENGTH)
  if (!Number.isSafeInteger(activityId) || (flagged && !reason)) return

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('set_activity_flag', {
    p_activity_id: activityId,
    p_flagged: flagged,
    p_reason: flagged ? reason : null,
  })
  if (error) throw new Error(`Không đánh dấu được hoạt động: ${error.message}`)
  revalidatePath('/admin/activities')
}

export async function retryStravaEvent(formData: FormData): Promise<void> {
  await requireBcn()
  const eventId = Number(formData.get('event_id'))
  if (!Number.isSafeInteger(eventId)) return

  const { error } = await createSupabaseServiceClient()
    .from('strava_events')
    .update({ attempts: 0, error: null, next_attempt_at: new Date().toISOString() })
    .eq('id', eventId)
  if (error) throw new Error(`Không đặt lại được event: ${error.message}`)
  revalidatePath('/admin/sync')
}
