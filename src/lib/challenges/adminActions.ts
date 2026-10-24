'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireBcn } from '@/lib/auth/requireBcn'
import { logAudit } from '@/lib/audit/logAudit'
import { parseChallengeInput, type CategoryInput, type ChallengeInput } from '@/lib/challenges/challengeInput'
import { monthsUntilNextMonth, shiftMonths } from '@/lib/challenges/dates'
import { loadChallenge, loadTemplateChallengeId } from '@/lib/challenges/loadChallenges'
import { recomputeChallenge } from '@/lib/challenges/recompute'
import { closeChallengeAndSettle } from '@/lib/challenges/settlement'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import { setFlashToast } from '@/lib/toast/setFlash'
import type { Database, Json } from '@/lib/types/database'

export type ChallengeFormState = {
  errors: Partial<Record<string, string>>
  values: Record<string, string>
}

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

function readRawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') values[key] = value
  })
  return values
}

function challengeRow(input: ChallengeInput) {
  return {
    title: input.title,
    description: input.description,
    cover_url: input.coverUrl,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    goal_type: input.goalType,
    activity_filter: input.activityFilter as Json,
    participation: input.participation,
    registration_closes_at: input.registrationClosesAt,
    ranking: input.ranking,
    penalty_rule: input.penaltyRule as unknown as Json,
    reward_rule: input.rewardRule as unknown as Json,
  }
}

function categoryRow(challengeId: string, category: CategoryInput, sort: number) {
  return {
    challenge_id: challengeId,
    name: category.name,
    goal_value: category.goalValue,
    gender: category.gender,
    member_type: category.memberType,
    sort,
  }
}

// Hạng mục đã có người tham gia thì chỉ được sửa, không xoá được
async function saveCategories(supabase: Supabase, challengeId: string, categories: CategoryInput[]) {
  const existing = await supabase.from('challenge_categories').select('id').eq('challenge_id', challengeId)
  const keptIds = new Set(categories.flatMap((category) => category.id ?? []))
  const removable = (existing.data ?? []).map((row) => row.id).filter((id) => !keptIds.has(id))
  if (removable.length > 0) {
    await supabase.from('challenge_categories').delete().in('id', removable).eq('challenge_id', challengeId)
  }
  for (const [index, category] of categories.entries()) {
    if (category.id) {
      await supabase
        .from('challenge_categories')
        .update(categoryRow(challengeId, category, index))
        .eq('id', category.id)
    } else {
      await supabase.from('challenge_categories').insert(categoryRow(challengeId, category, index))
    }
  }
}

export async function saveChallenge(_previous: ChallengeFormState, formData: FormData): Promise<ChallengeFormState> {
  const bcn = await requireBcn()
  const values = readRawValues(formData)
  const parsed = parseChallengeInput(formData)
  if (!parsed.ok) return { errors: parsed.errors, values }

  const supabase = await createSupabaseServerClient()
  const challengeId = values.id || null
  let savedId = challengeId
  if (challengeId) {
    const { error } = await supabase.from('challenges').update(challengeRow(parsed.value)).eq('id', challengeId)
    if (error) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }
  } else {
    const { data, error } = await supabase
      .from('challenges')
      .insert({ ...challengeRow(parsed.value), created_by: bcn.id })
      .select('id')
      .single()
    if (error || !data) return { errors: { form: 'Không tạo được, vui lòng thử lại' }, values }
    savedId = data.id
  }
  if (!savedId) return { errors: { form: 'Không lưu được, vui lòng thử lại' }, values }

  await saveCategories(supabase, savedId, parsed.value.categories)
  await logAudit({
    action: challengeId ? 'update_challenge' : 'create_challenge',
    targetTable: 'challenges',
    targetId: savedId,
  })
  await setFlashToast('challenge_saved')
  revalidatePath('/admin/challenges')
  redirect(`/admin/challenges/${savedId}`)
}

export async function publishChallenge(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const challengeId = String(formData.get('challenge_id') ?? '')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('publish_challenge', {
    p_challenge_id: challengeId,
  })
  if (error) return actionError(error.message.includes('hạng mục') ? 'Cần ít nhất một hạng mục' : 'Không công bố được')

  await recomputeChallenge(createSupabaseServiceClient(), challengeId)
  revalidatePath(`/admin/challenges/${challengeId}`)
  revalidatePath('/admin/challenges')
  return actionSuccess('Đã công bố challenge')
}

export async function recomputeChallengeAction(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const challengeId = String(formData.get('challenge_id') ?? '')
  try {
    const count = await recomputeChallenge(createSupabaseServiceClient(), challengeId)
    revalidatePath(`/admin/challenges/${challengeId}`)
    return actionSuccess(`Đã tính lại cho ${count} người`)
  } catch (error) {
    console.error('Không tính lại được challenge', challengeId, error)
    return actionError('Không tính lại được, vui lòng thử lại')
  }
}

async function copyChallenge(sourceId: string, monthsShift: number): Promise<string | null> {
  const bcn = await requireBcn()
  const source = await loadChallenge(sourceId)
  if (!source) return null

  const supabase = await createSupabaseServerClient()
  const { challenge } = source
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      title: challenge.title,
      description: challenge.description,
      cover_url: challenge.cover_url,
      starts_at: shiftMonths(challenge.starts_at, monthsShift),
      ends_at: shiftMonths(challenge.ends_at, monthsShift),
      goal_type: challenge.goal_type,
      activity_filter: challenge.activity_filter,
      participation: challenge.participation,
      registration_closes_at: challenge.registration_closes_at
        ? shiftMonths(challenge.registration_closes_at, monthsShift)
        : null,
      ranking: challenge.ranking,
      penalty_rule: challenge.penalty_rule,
      reward_rule: challenge.reward_rule,
      created_by: bcn.id,
    })
    .select('id')
    .single()
  if (error || !data) return null

  await supabase.from('challenge_categories').insert(
    source.categories.map((category, index) => ({
      challenge_id: data.id,
      name: category.name,
      goal_value: category.goal_value,
      gender: category.gender,
      member_type: category.member_type,
      sort: index,
    })),
  )
  await logAudit({
    action: 'clone_challenge',
    targetTable: 'challenges',
    targetId: data.id,
    before: { source: sourceId },
  })
  return data.id
}

export async function cloneChallenge(formData: FormData): Promise<ActionResult | void> {
  const sourceId = String(formData.get('challenge_id') ?? '')
  const newId = await copyChallenge(sourceId, 1)
  if (!newId) return actionError('Không nhân bản được')
  await setFlashToast('challenge_cloned')
  redirect(`/admin/challenges/${newId}`)
}

export async function createFromTemplate(): Promise<ActionResult | void> {
  await requireBcn()
  const templateId = await loadTemplateChallengeId()
  const template = templateId ? await loadChallenge(templateId) : null
  if (!templateId || !template) return actionError('Chưa có challenge mẫu')

  const months = monthsUntilNextMonth(template.challenge.starts_at, new Date())
  const newId = await copyChallenge(templateId, months)
  if (!newId) return actionError('Không tạo được từ mẫu')
  await setFlashToast('challenge_cloned')
  redirect(`/admin/challenges/${newId}`)
}

export async function setAsTemplate(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const challengeId = String(formData.get('challenge_id') ?? '')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('settings').upsert({ key: 'challenge_template_id', value: challengeId })
  if (error) return actionError('Không lưu được mẫu')
  await logAudit({
    action: 'set_challenge_template',
    targetTable: 'settings',
    targetId: 'challenge_template_id',
    after: { challengeId },
  })
  revalidatePath('/admin/challenges')
  return actionSuccess('Đã đặt làm challenge mẫu')
}

type EntryUpdate = Database['public']['Tables']['challenge_entries']['Update']

async function updateEntry(formData: FormData, update: EntryUpdate, action: string, success: string) {
  await requireBcn()
  const challengeId = String(formData.get('challenge_id') ?? '')
  const memberId = String(formData.get('member_id') ?? '')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('challenge_entries')
    .update(update)
    .eq('challenge_id', challengeId)
    .eq('member_id', memberId)
  if (error) return actionError('Không cập nhật được, vui lòng thử lại')

  await logAudit({
    action,
    targetTable: 'challenge_entries',
    targetId: `${challengeId}:${memberId}`,
    after: update as Json,
  })
  await recomputeChallenge(createSupabaseServiceClient(), challengeId)
  revalidatePath(`/admin/challenges/${challengeId}`)
  return actionSuccess(success)
}

export async function setEntryExcluded(formData: FormData): Promise<ActionResult> {
  const excluded = formData.get('excluded') === 'true'
  const reason = String(formData.get('reason') ?? '').trim()
  if (excluded && !reason) return actionError('Cần nhập lý do loại')
  return updateEntry(
    formData,
    { excluded, excluded_reason: excluded ? reason : null },
    excluded ? 'exclude_challenge_entry' : 'include_challenge_entry',
    excluded ? 'Đã loại khỏi challenge' : 'Đã đưa trở lại challenge',
  )
}

export async function setEntryCategory(formData: FormData): Promise<ActionResult> {
  return updateEntry(
    formData,
    { category_id: String(formData.get('category_id') ?? '') },
    'move_challenge_entry',
    'Đã chuyển hạng mục',
  )
}

export async function setEntryWaived(formData: FormData): Promise<ActionResult> {
  const waived = formData.get('waived') === 'true'
  const reason = String(formData.get('reason') ?? '').trim()
  if (waived && !reason) return actionError('Cần nhập lý do miễn phạt')
  return updateEntry(
    formData,
    { penalty_waived: waived, waived_reason: waived ? reason : null },
    waived ? 'waive_challenge_entry' : 'unwaive_challenge_entry',
    waived ? 'Đã miễn phạt' : 'Đã bỏ miễn phạt',
  )
}

export async function addEntry(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const challengeId = String(formData.get('challenge_id') ?? '')
  const memberId = String(formData.get('member_id') ?? '')
  const categoryId = String(formData.get('category_id') ?? '')
  if (!memberId || !categoryId) return actionError('Chọn thành viên và hạng mục')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('challenge_entries').insert({
    challenge_id: challengeId,
    member_id: memberId,
    category_id: categoryId,
  })
  if (error) return actionError('Không thêm được (có thể đã tham gia)')

  await logAudit({
    action: 'add_challenge_entry',
    targetTable: 'challenge_entries',
    targetId: `${challengeId}:${memberId}`,
  })
  await recomputeChallenge(createSupabaseServiceClient(), challengeId)
  revalidatePath(`/admin/challenges/${challengeId}`)
  return actionSuccess('Đã thêm vào challenge')
}

export async function closeChallengeAction(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const challengeId = String(formData.get('challenge_id') ?? '')
  const outcome = await closeChallengeAndSettle(challengeId)
  if (!outcome.ok) return actionError(outcome.error)

  revalidatePath(`/admin/challenges/${challengeId}`)
  revalidatePath('/admin/challenges')
  return actionSuccess(`Đã chốt: ${outcome.penalties} khoản phạt, ${outcome.rewards} khoản thưởng`)
}
