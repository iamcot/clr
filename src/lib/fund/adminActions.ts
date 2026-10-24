'use server'

import { revalidatePath } from 'next/cache'
import { BANKS } from '@/config/fund'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatVnd } from '@/lib/format/money'
import { parseAmount, parseManualTransaction } from '@/lib/fund/transactionInput'
import { isUuid } from '@/lib/storage/uploadRules'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'

const ACCOUNT_NUMBER_PATTERN = /^[0-9A-Za-z]{4,19}$/

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

function refreshFundPages() {
  revalidatePath('/admin/fund')
  revalidatePath('/admin/penalties')
  revalidatePath('/fund')
}

export async function saveFundAccount(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const bankBin = text(formData, 'bank_bin')
  const accountNo = text(formData, 'account_no').replace(/\s/g, '')
  const accountName = text(formData, 'account_name')
  if (!BANKS.some((bank) => bank.bin === bankBin)) return actionError('Chọn ngân hàng')
  if (!ACCOUNT_NUMBER_PATTERN.test(accountNo)) return actionError('Số tài khoản không hợp lệ')
  if (!accountName) return actionError('Nhập tên chủ tài khoản')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('fund_accounts')
    .update({ bank_bin: bankBin, account_no: accountNo, account_name: accountName })
    .eq('kind', 'bank')
  if (error) return actionError('Không lưu được tài khoản')
  await supabase.rpc('log_audit', {
    p_action: 'save_fund_account',
    p_target_table: 'fund_accounts',
    p_target_id: 'bank',
    p_before: null,
    p_after: { bank_bin: bankBin, account_no: accountNo },
  })
  refreshFundPages()
  return actionSuccess('Đã lưu tài khoản nhận tiền')
}

export async function addFundTransaction(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const parsed = parseManualTransaction(formData)
  if (!parsed.ok) return actionError(parsed.message)
  const { accountId, amount, categoryId, occurredAt, description, receiptUrl } = parsed.value

  const supabase = await createSupabaseServerClient()
  const category = await supabase.from('fund_categories').select('direction').eq('id', categoryId).maybeSingle()
  const direction = category.data?.direction
  if (direction !== 'in' && direction !== 'out') return actionError('Không tìm thấy danh mục')

  const { error } = await supabase.rpc('add_fund_transaction', {
    p_account_id: accountId,
    p_direction: direction,
    p_amount: amount,
    p_category_id: categoryId,
    p_occurred_at: occurredAt ?? new Date().toISOString(),
    p_description: description,
    p_member_id: null,
    p_event_id: null,
    p_receipt_url: receiptUrl,
  })
  if (error) return actionError('Không ghi được giao dịch')
  refreshFundPages()
  return actionSuccess(`Đã ghi ${direction === 'in' ? 'khoản thu' : 'khoản chi'} ${formatVnd(amount)}`)
}

export async function voidFundTransaction(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const id = text(formData, 'id')
  const reason = text(formData, 'reason')
  if (!isUuid(id)) return actionError('Không tìm thấy giao dịch')
  if (!reason) return actionError('Huỷ giao dịch cần lý do')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('void_fund_transaction', { p_id: id, p_reason: reason })
  if (error) return actionError('Không huỷ được giao dịch')
  refreshFundPages()
  return actionSuccess('Đã huỷ giao dịch')
}

export async function classifyFundTransaction(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const id = text(formData, 'id')
  const categoryId = text(formData, 'category_id')
  const memberId = text(formData, 'member_id')
  if (!isUuid(id) || !isUuid(categoryId)) return actionError('Chọn danh mục')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('classify_fund_transaction', {
    p_id: id,
    p_category_id: categoryId,
    p_member_id: isUuid(memberId) ? memberId : null,
    p_description: text(formData, 'description') || null,
  })
  if (error) return actionError('Không phân loại được')
  refreshFundPages()
  return actionSuccess('Đã phân loại giao dịch')
}

export async function resolveBankEvent(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const eventId = text(formData, 'event_id')
  const intentId = text(formData, 'intent_id')
  if (!isUuid(eventId) || !isUuid(intentId)) return actionError('Chọn lần nộp cần ghép')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('resolve_bank_event', { p_event_id: eventId, p_intent_id: intentId })
  if (error) return actionError('Không ghép được giao dịch')
  refreshFundPages()
  return actionSuccess('Đã ghép giao dịch, khoản phạt chuyển sang đã nộp')
}

export async function confirmCashPayment(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const intentId = text(formData, 'intent_id')
  if (!isUuid(intentId)) return actionError('Không tìm thấy yêu cầu')
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('confirm_cash_payment', { p_intent_id: intentId })
  if (error) return actionError('Không xác nhận được')
  refreshFundPages()
  return actionSuccess('Đã nhận tiền mặt, khoản phạt chuyển sang đã nộp')
}

export async function recordFundReconciliation(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const accountId = text(formData, 'account_id')
  const asOf = text(formData, 'as_of')
  const statementBalance = parseAmount(text(formData, 'statement_balance'), true)
  if (!isUuid(accountId) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return actionError('Chọn tài khoản và ngày sao kê')
  if (statementBalance === null) return actionError('Nhập số dư theo sao kê')
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('record_fund_reconciliation', {
    p_account_id: accountId,
    p_as_of: asOf,
    p_statement_balance: statementBalance,
    p_note: text(formData, 'note'),
  })
  if (error || data === null) return actionError('Không ghi được đối chiếu')
  refreshFundPages()
  return data === 0
    ? actionSuccess('Số dư khớp với sao kê')
    : actionError(`Chênh lệch ${formatVnd(Math.abs(data))}: sao kê ${data > 0 ? 'nhiều hơn' : 'ít hơn'} số trong app`)
}
