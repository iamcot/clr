'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { isUuid } from '@/lib/storage/uploadRules'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, type ActionResult } from '@/lib/toast/actionResult'

// Tạo lần nộp cho các khoản phạt đã chọn rồi chuyển sang màn mã QR; số tiền do DB tính
export async function startPayment(formData: FormData): Promise<ActionResult | void> {
  await requireActiveMember()
  const penaltyIds = formData.getAll('penalty_ids').map(String).filter(isUuid)
  if (penaltyIds.length === 0) return actionError('Chọn ít nhất một khoản để nộp')
  const method = formData.get('method') === 'cash' ? 'cash' : 'bank'

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('create_payment_intent', { p_penalty_ids: penaltyIds, p_method: method })
  if (error || !data) return actionError('Không tạo được lần nộp, các khoản có thể đã được nộp')
  redirect(`/fund/pay/${data}`)
}

export async function cancelPayment(formData: FormData): Promise<ActionResult | void> {
  await requireActiveMember()
  const intentId = String(formData.get('intent_id') ?? '')
  if (!isUuid(intentId)) return actionError('Không tìm thấy lần nộp')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('cancel_payment_intent', { p_intent_id: intentId })
  if (error) return actionError('Không huỷ được')
  revalidatePath('/fund')
  redirect('/fund')
}

