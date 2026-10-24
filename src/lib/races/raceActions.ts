'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { matchPrDistanceName, parseRaceResultInput, type RaceResultInput } from '@/lib/races/raceInput'
import type { RaceFormState } from '@/lib/races/raceFormState'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import { setFlashToast } from '@/lib/toast/setFlash'

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

const FORM_FIELDS = [
  'id',
  'race_name',
  'race_date',
  'city',
  'organizer',
  'url',
  'distance',
  'distance_label',
  'distance_km',
  'chip_time',
  'gun_time',
  'rank_overall',
  'rank_age_group',
  'bib',
  'certificate_url',
  'activity_id',
]

function readRawValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(FORM_FIELDS.map((field) => [field, String(formData.get(field) ?? '')]))
}

async function findOwnActivityId(supabase: Supabase, memberId: string, activityId: number | null) {
  if (activityId === null) return null
  const { data } = await supabase.from('activities').select('id').eq('id', activityId).eq('member_id', memberId).maybeSingle()
  return data?.id ?? null
}

async function findOrCreateRaceId(supabase: Supabase, memberId: string, input: RaceResultInput): Promise<string | null> {
  const sameDay = await supabase.from('races').select('id, name').eq('race_date', input.raceDate)
  const existing = (sameDay.data ?? []).find((race) => race.name.toLowerCase() === input.raceName.toLowerCase())
  if (existing) return existing.id

  const created = await supabase
    .from('races')
    .insert({
      name: input.raceName,
      race_date: input.raceDate,
      city: input.city,
      organizer: input.organizer,
      url: input.url,
      created_by: memberId,
    })
    .select('id')
    .single()
  return created.data?.id ?? null
}

export async function saveRaceResult(_previous: RaceFormState, formData: FormData): Promise<RaceFormState> {
  const member = await requireActiveMember()
  const values = readRawValues(formData)

  const parsed = parseRaceResultInput(formData)
  if (!parsed.ok) return { errors: parsed.errors, values }

  const supabase = await createSupabaseServerClient()
  const raceId = await findOrCreateRaceId(supabase, member.id, parsed.value)
  if (!raceId) return { errors: { form: 'Không lưu được giải, vui lòng thử lại' }, values }

  const input = parsed.value
  const row = {
    member_id: member.id,
    race_id: raceId,
    distance_label: input.distanceLabel,
    distance_m: input.distanceMeters,
    chip_time_s: input.chipTimeSeconds,
    gun_time_s: input.gunTimeSeconds,
    rank_overall: input.rankOverall,
    rank_age_group: input.rankAgeGroup,
    bib: input.bib,
    certificate_url: input.certificateUrl,
    activity_id: await findOwnActivityId(supabase, member.id, input.activityId),
  }
  const resultId = values.id
  const { error } = resultId
    ? await supabase.from('race_results').update(row).eq('id', resultId).eq('member_id', member.id)
    : await supabase.from('race_results').insert(row)
  if (error) return { errors: { form: 'Không lưu được kết quả, vui lòng thử lại' }, values }

  await setFlashToast('race_saved')
  revalidatePath('/me')
  redirect('/me/races')
}

export async function deleteRaceResult(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('race_results')
    .delete()
    .eq('id', String(formData.get('result_id') ?? ''))
    .eq('member_id', member.id)
  if (error) return actionError('Không xoá được, vui lòng thử lại')

  revalidatePath('/me/races')
  revalidatePath('/me')
  return actionSuccess('Đã xoá kết quả giải')
}

export async function setPrFromRaceResult(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const resultId = String(formData.get('result_id') ?? '')
  const { data: result } = await supabase
    .from('race_results')
    .select('id, distance_label, chip_time_s')
    .eq('id', resultId)
    .eq('member_id', member.id)
    .maybeSingle()
  const distanceName = result ? matchPrDistanceName(result.distance_label) : null
  if (!result || !distanceName) return actionError('Cự ly này không nằm trong danh sách PR')

  const { error } = await supabase.from('pr_overrides').upsert({
    member_id: member.id,
    distance_name: distanceName,
    time_s: result.chip_time_s,
    source: 'race',
    race_result_id: result.id,
  })
  if (error) return actionError('Không lưu được PR, vui lòng thử lại')

  revalidatePath('/me')
  return actionSuccess('Đã dùng kết quả giải làm PR')
}

export async function removePrOverride(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('pr_overrides')
    .delete()
    .eq('member_id', member.id)
    .eq('distance_name', String(formData.get('distance_name') ?? ''))
  if (error) return actionError('Không gỡ được, vui lòng thử lại')

  revalidatePath('/me')
  return actionSuccess('Đã quay lại dùng PR từ Strava')
}

export async function linkRaceActivity(formData: FormData): Promise<ActionResult> {
  const member = await requireActiveMember()
  const supabase = await createSupabaseServerClient()
  const activityId = await findOwnActivityId(supabase, member.id, Number(formData.get('activity_id')) || null)
  if (activityId === null) return actionError('Không tìm thấy hoạt động')

  const { error } = await supabase
    .from('race_results')
    .update({ activity_id: activityId })
    .eq('id', String(formData.get('result_id') ?? ''))
    .eq('member_id', member.id)
  if (error) return actionError('Không gắn được hoạt động, vui lòng thử lại')

  revalidatePath('/me/races')
  return actionSuccess('Đã gắn hoạt động Strava')
}
