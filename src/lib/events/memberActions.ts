'use server'

import { revalidatePath } from 'next/cache'
import { MEMBER_ATTENDANCE_CHOICES } from '@/config/events'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { attendanceErrorText, attendanceResultText } from '@/lib/events/attendanceMessages'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import type { AttendanceStatus } from '@/lib/types/database'

export async function setAttendance(formData: FormData): Promise<ActionResult> {
  await requireActiveMember()
  const eventId = String(formData.get('event_id') ?? '')
  const status = MEMBER_ATTENDANCE_CHOICES.find((choice) => choice === formData.get('status'))
  if (!status) return actionError('Lựa chọn không hợp lệ')

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('set_event_attendance', { p_event_id: eventId, p_status: status })
  if (error) return actionError(attendanceErrorText(error.message))
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return actionSuccess(attendanceResultText((data ?? status) as AttendanceStatus))
}
