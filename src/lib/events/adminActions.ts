'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit/logAudit'
import { requireBcn } from '@/lib/auth/requireBcn'
import { parseEventInput, type EventInput } from '@/lib/events/eventInput'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import { setFlashToast } from '@/lib/toast/setFlash'

export type EventFormState = {
  errors: Partial<Record<string, string>>
  values: Record<string, string>
}

function readRawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') values[key] = value
  })
  return values
}

function eventRow(input: EventInput) {
  return {
    title: input.title,
    kind: input.kind,
    description_md: input.descriptionMd,
    cover_url: input.coverUrl,
    location_name: input.locationName,
    location_lat: input.locationLat,
    location_lng: input.locationLng,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    registration_closes_at: input.registrationClosesAt,
    capacity: input.capacity,
    fee: input.fee,
    route_distance_m: input.routeDistanceM,
    status: input.status,
    absent_penalty: input.absentPenalty,
  }
}

function revalidateEvent(eventId: string) {
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${eventId}`)
}

export async function saveEvent(_previous: EventFormState, formData: FormData): Promise<EventFormState> {
  const bcn = await requireBcn()
  const values = readRawValues(formData)
  const parsed = parseEventInput(formData)
  if (!parsed.ok) return { errors: parsed.errors, values }

  const supabase = await createSupabaseServerClient()
  const eventId = values.id || null
  let savedId = eventId
  if (eventId) {
    const { error } = await supabase.from('events').update(eventRow(parsed.value)).eq('id', eventId)
    if (error) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }
    await supabase.rpc('promote_event_waitlist_bcn', { p_event_id: eventId })
  } else {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...eventRow(parsed.value), created_by: bcn.id })
      .select('id')
      .single()
    if (error || !data) return { errors: { form: 'Không tạo được, vui lòng thử lại' }, values }
    savedId = data.id
  }
  if (!savedId) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }

  await logAudit({ action: eventId ? 'update_event' : 'create_event', targetTable: 'events', targetId: savedId })
  revalidateEvent(savedId)
  await setFlashToast('event_saved')
  redirect(`/admin/events/${savedId}`)
}

export async function setCheckin(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const eventId = String(formData.get('event_id') ?? '')
  const memberId = String(formData.get('member_id') ?? '')
  const checkedIn = formData.get('checked_in') === '1'

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('event_attendees')
    .update(
      checkedIn
        ? { checked_in_at: new Date().toISOString(), checked_in_by: bcn.id, status: 'going' as const }
        : { checked_in_at: null, checked_in_by: null },
    )
    .eq('event_id', eventId)
    .eq('member_id', memberId)
  if (error) return actionError('Không cập nhật được điểm danh')
  revalidateEvent(eventId)
  return actionSuccess(checkedIn ? 'Đã điểm danh' : 'Đã bỏ điểm danh')
}

export type CheckinCode = { code: string; expiresInSeconds: number }

export async function loadCheckinCode(eventId: string): Promise<CheckinCode | null> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('event_checkin_code', { p_event_id: eventId })
  const row = data?.[0]
  return row ? { code: row.code, expiresInSeconds: row.expires_in_s } : null
}

export async function createAbsentPenalties(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const eventId = String(formData.get('event_id') ?? '')
  const supabase = await createSupabaseServerClient()

  const [event, penaltyType, absentees] = await Promise.all([
    supabase.from('events').select('title, absent_penalty').eq('id', eventId).single(),
    supabase.from('penalty_types').select('id, default_amount').eq('code', 'event_absent').single(),
    supabase
      .from('event_attendees')
      .select('member_id')
      .eq('event_id', eventId)
      .eq('status', 'going')
      .is('checked_in_at', null)
      .is('activity_id', null),
  ])
  if (event.error || penaltyType.error) return actionError('Không đọc được dữ liệu event')
  if (!event.data.absent_penalty) return actionError('Event này không bật phạt vắng')
  const memberIds = (absentees.data ?? []).map((row) => row.member_id)
  if (memberIds.length === 0) return actionSuccess('Không có ai vắng')

  const { error } = await supabase.from('penalties').upsert(
    memberIds.map((memberId) => ({
      member_id: memberId,
      type_id: penaltyType.data.id,
      amount: penaltyType.data.default_amount,
      reason: `Đăng ký nhưng vắng: ${event.data.title}`,
      source_type: 'event' as const,
      source_id: eventId,
      created_by: bcn.id,
    })),
    { onConflict: 'member_id,source_type,source_id,type_id', ignoreDuplicates: true },
  )
  if (error) return actionError('Không sinh được khoản phạt')
  await logAudit({
    action: 'create_event_absent_penalties',
    targetTable: 'events',
    targetId: eventId,
    after: { member_count: memberIds.length },
  })
  revalidatePath('/admin/penalties')
  return actionSuccess(`Đã sinh phạt cho ${memberIds.length} người vắng`)
}
