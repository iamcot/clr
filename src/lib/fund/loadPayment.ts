import 'server-only'
import { BANKS, type IntentStatus } from '@/config/fund'
import { buildVietQrPayload, paymentTransferNote } from '@/lib/vietqr/payload'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PaymentQr = { payload: string; bankName: string; accountNo: string; accountName: string }

export type PaymentView = {
  id: string
  ref: string
  method: 'bank' | 'cash'
  amount: number
  status: IntentStatus
  expiresAt: string
  penaltyCount: number
  note: string
  qr: PaymentQr | null
}

// Lần nộp quá hạn mà chưa có tiền hiện là hết hạn (DB không có job đổi trạng thái)
export function effectiveIntentStatus(status: string, expiresAt: string, now: Date): IntentStatus {
  if (status === 'pending' && Date.parse(expiresAt) <= now.getTime()) return 'expired'
  return status as IntentStatus
}

export async function loadIntentStatus(intentId: string, now: Date): Promise<IntentStatus | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('payment_intents').select('status, expires_at').eq('id', intentId).maybeSingle()
  return data ? effectiveIntentStatus(data.status, data.expires_at, now) : null
}

async function loadReceivingQr(amount: number, note: string): Promise<PaymentQr | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('get_fund_receiving_account')
  const account = data?.[0]
  if (!account) return null
  return {
    payload: buildVietQrPayload({ bankBin: account.bank_bin, accountNo: account.account_no, amount, addInfo: note }),
    bankName: BANKS.find((bank) => bank.bin === account.bank_bin)?.name ?? '',
    accountNo: account.account_no,
    accountName: account.account_name,
  }
}

export async function loadPaymentView(intentId: string, memberCode: string, now: Date): Promise<PaymentView | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('payment_intents').select('*').eq('id', intentId).maybeSingle()
  if (!data) return null
  const note = paymentTransferNote(memberCode, data.ref)
  const amount = Number(data.amount)
  return {
    id: data.id,
    ref: data.ref,
    method: data.method === 'cash' ? 'cash' : 'bank',
    amount,
    status: effectiveIntentStatus(data.status, data.expires_at, now),
    expiresAt: data.expires_at,
    penaltyCount: data.penalty_ids.length,
    note,
    qr: data.method === 'bank' ? await loadReceivingQr(amount, note) : null,
  }
}
