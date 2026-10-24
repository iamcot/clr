import 'server-only'
import { MATCH_LOOKBACK_DAYS } from '@/config/fund'
import { matchTransfer, type CandidateIntent, type TransferMatch } from '@/lib/vietqr/match'
import type { BankTransferEvent } from '@/lib/vietqr/sepay'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Json } from '@/lib/types/database'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

const DAY_MS = 24 * 3600 * 1000
const CANDIDATE_LIMIT = 1000

async function loadCandidateIntents(db: ServiceClient, now: Date): Promise<CandidateIntent[]> {
  const since = new Date(now.getTime() - MATCH_LOOKBACK_DAYS * DAY_MS).toISOString()
  const { data } = await db
    .from('payment_intents')
    .select('id, ref, amount, status')
    .eq('method', 'bank')
    .gte('created_at', since)
    .limit(CANDIDATE_LIMIT)
  return (data ?? []).map((row) => ({ id: row.id, ref: row.ref, amount: Number(row.amount), status: row.status }))
}

async function findMemberByCode(db: ServiceClient, memberCode: string): Promise<string | null> {
  const { data } = await db.from('members').select('id').eq('member_code', memberCode).maybeSingle()
  return data?.id ?? null
}

type Outcome = { status: string; intentId: string | null; memberId: string | null }

async function outcomeOf(db: ServiceClient, match: TransferMatch): Promise<Outcome> {
  if (match.kind === 'ignored') return { status: 'ignored', intentId: null, memberId: null }
  if (match.kind === 'paid') return { status: 'paid', intentId: match.intentId, memberId: null }
  if (match.kind === 'mismatch') return { status: 'mismatch', intentId: match.intentId, memberId: null }
  if (match.kind === 'duplicate') return { status: 'duplicate', intentId: match.intentId, memberId: null }
  if (match.kind === 'member_hint') {
    return { status: 'needs_review', intentId: null, memberId: await findMemberByCode(db, match.memberCode) }
  }
  return { status: 'unmatched', intentId: null, memberId: null }
}

// Ghi giao dịch rồi đối soát. Webhook gửi lại thì không ghi thêm, nhưng nếu lần trước chưa xử lý xong thì xử lý nốt
export async function processBankEvent(db: ServiceClient, event: BankTransferEvent, now = new Date()): Promise<void> {
  const { data, error } = await db.rpc('record_bank_event', {
    p_provider: event.provider,
    p_txn_id: event.txnId,
    p_direction: event.direction,
    p_amount: event.amount,
    p_content: event.content,
    p_account_no: event.accountNo,
    p_transferred_at: event.transferredAt,
    p_raw: event.raw as Json,
  })
  const recorded = data?.[0]
  if (error || !recorded) throw new Error(`Không ghi được giao dịch ngân hàng: ${error?.message ?? 'rỗng'}`)
  if (recorded.processed) return

  const match = matchTransfer(event, await loadCandidateIntents(db, now))
  const outcome = await outcomeOf(db, match)
  const finished = await db.rpc('finish_bank_event', {
    p_event_id: recorded.event_id,
    p_status: outcome.status,
    p_intent_id: outcome.intentId,
    p_member_id: outcome.memberId,
  })
  if (finished.error) throw new Error(`Không đối soát được giao dịch: ${finished.error.message}`)
}
