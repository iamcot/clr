'use server'

import { revalidatePath } from 'next/cache'
import { PAYMENT_METHODS, PENALTY_TYPES, type PaymentMethod } from '@/config/penalties'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

function selectedIds(formData: FormData): string[] {
  return formData.getAll('ids').filter((value): value is string => typeof value === 'string' && value !== '')
}

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function revalidateFund() {
  revalidatePath('/admin/penalties')
  revalidatePath('/admin/rewards')
  revalidatePath('/fund')
}

async function markPaid(ids: string[], formData: FormData): Promise<ActionResult> {
  const method = PAYMENT_METHODS.find((item): item is PaymentMethod => item === readText(formData, 'method'))
  if (!method) return actionError('Chọn hình thức nộp')
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('mark_penalties_paid', {
    p_ids: ids,
    p_method: method,
    p_ref: readText(formData, 'payment_ref'),
  })
  if (error) return actionError('Không đánh dấu được')
  return actionSuccess(`Đã đánh dấu ${data} khoản đã nộp`)
}

async function waive(ids: string[], formData: FormData): Promise<ActionResult> {
  const reason = readText(formData, 'reason')
  if (!reason) return actionError('Miễn phạt cần lý do')
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('waive_penalties', {
    p_ids: ids,
    p_reason: reason,
  })
  if (error) return actionError('Không miễn được')
  return actionSuccess(`Đã miễn ${data} khoản`)
}

export async function applyPenaltySelection(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const ids = selectedIds(formData)
  if (ids.length === 0) return actionError('Chưa chọn khoản nào')

  const result = formData.get('intent') === 'waive' ? await waive(ids, formData) : await markPaid(ids, formData)
  revalidateFund()
  return result
}

export async function unmarkPenaltyPaid(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const reason = readText(formData, 'reason')
  if (!reason) return actionError('Huỷ trạng thái nộp cần lý do')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('unmark_penalty_paid', {
    p_id: readText(formData, 'id'),
    p_reason: reason,
  })
  if (error) return actionError('Không huỷ được')
  revalidateFund()
  return actionSuccess('Đã chuyển về chưa nộp')
}

export async function addManualPenalties(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const memberIds = formData
    .getAll('member_ids')
    .filter((value): value is string => typeof value === 'string' && value !== '')
  const type = PENALTY_TYPES.find((item) => item.code === readText(formData, 'type_code'))
  const amount = Number(readText(formData, 'amount'))
  if (memberIds.length === 0) return actionError('Chưa chọn thành viên')
  if (!type) return actionError('Chọn loại phạt')
  if (!Number.isInteger(amount) || amount <= 0) return actionError('Số tiền phải là số nguyên dương')

  const supabase = await createSupabaseServerClient()
  const typeRow = await supabase.from('penalty_types').select('id').eq('code', type.code).single()
  if (typeRow.error) return actionError('Không đọc được loại phạt')

  const reason = readText(formData, 'reason')
  const { error } = await supabase.from('penalties').insert(
    memberIds.map((memberId) => ({
      member_id: memberId,
      type_id: typeRow.data.id,
      amount,
      reason: reason || type.name,
      source_type: 'manual',
      created_by: bcn.id,
    })),
  )
  if (error) return actionError('Không thêm được khoản phạt')
  await supabase.rpc('log_audit', {
    p_action: 'add_manual_penalties',
    p_target_table: 'penalties',
    p_target_id: 'batch',
    p_before: null,
    p_after: { member_count: memberIds.length, type: type.code, amount },
  })
  revalidateFund()
  return actionSuccess(`Đã thêm ${memberIds.length} khoản phạt`)
}

export async function markRewardGiven(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const id = readText(formData, 'id')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('rewards')
    .update({ status: 'given', given_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) return actionError('Không cập nhật được')
  await supabase.rpc('log_audit', {
    p_action: 'give_reward',
    p_target_table: 'rewards',
    p_target_id: id,
    p_before: null,
    p_after: { by: bcn.id },
  })
  revalidateFund()
  return actionSuccess('Đã đánh dấu đã trao')
}

export async function saveFundSettings(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const supabase = await createSupabaseServerClient()
  const entries = [
    { key: 'fund_bank_name', value: readText(formData, 'bank_name') },
    { key: 'fund_account_number', value: readText(formData, 'account_number') },
    { key: 'fund_account_holder', value: readText(formData, 'account_holder') },
    {
      key: 'penalty_totals_public',
      value: formData.get('totals_public') === 'on',
    },
  ]
  const { error } = await supabase.from('settings').upsert(entries)
  if (error) return actionError('Không lưu được thông tin tài khoản')
  revalidatePath('/fund')
  revalidatePath('/admin/penalties')
  return actionSuccess('Đã lưu thông tin tài khoản quỹ')
}
