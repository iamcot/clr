import 'server-only'
import { QUEUE_LIMIT, RECENT_TRANSACTIONS_LIMIT, type BankEventStatus } from '@/config/fund'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type FundBalance = { accountId: string; name: string; kind: string; balance: number }
export type FundAccount = { id: string; name: string; kind: string; bankBin: string; accountNo: string; accountName: string }
export type FundCategory = { id: string; direction: 'in' | 'out'; name: string }

export type QueuedEvent = {
  id: string
  status: BankEventStatus
  amount: number
  content: string
  transferredAt: string
  transactionId: string | null
  suggestedMemberName: string | null
  matchedRef: string | null
}

export type OpenIntent = { id: string; ref: string; amount: number; memberName: string; status: string }
export type CashRequest = { id: string; amount: number; memberName: string; createdAt: string }

export type FundTransactionRow = {
  id: string
  direction: 'in' | 'out'
  amount: number
  categoryName: string
  occurredAt: string
  description: string
  memberName: string | null
  accountName: string
  receiptUrl: string | null
  voidedAt: string | null
  voidReason: string | null
}

export type ReconciliationRow = {
  id: string
  accountName: string
  asOf: string
  statementBalance: number
  appBalance: number
  difference: number
  note: string
}

export type AdminFundData = {
  balances: FundBalance[]
  accounts: FundAccount[]
  categories: FundCategory[]
  queue: QueuedEvent[]
  openIntents: OpenIntent[]
  cashRequests: CashRequest[]
  transactions: FundTransactionRow[]
  reconciliations: ReconciliationRow[]
}

const QUEUE_STATUSES: BankEventStatus[] = ['mismatch', 'needs_review', 'unmatched', 'duplicate']

function direction(value: string): 'in' | 'out' {
  return value === 'out' ? 'out' : 'in'
}

export async function loadAdminFund(): Promise<AdminFundData> {
  const supabase = await createSupabaseServerClient()
  const [balances, accounts, categories, events, intents, transactions, reconciliations] = await Promise.all([
    supabase.from('fund_balances').select('*'),
    supabase.from('fund_accounts').select('*').order('created_at'),
    supabase.from('fund_categories').select('*').order('sort'),
    supabase
      .from('bank_webhook_events')
      .select('id, match_status, amount, content, transferred_at, suggested_member_id, matched_intent_id')
      .in('match_status', QUEUE_STATUSES)
      .order('transferred_at', { ascending: false })
      .limit(QUEUE_LIMIT),
    supabase
      .from('payment_intents')
      .select('id, ref, amount, method, status, member_id, created_at')
      .in('status', ['pending', 'expired', 'mismatch', 'cash_pending'])
      .order('created_at', { ascending: false })
      .limit(QUEUE_LIMIT),
    supabase
      .from('fund_transactions')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(RECENT_TRANSACTIONS_LIMIT),
    supabase.from('fund_reconciliations').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const eventRows = events.data ?? []
  const intentRows = intents.data ?? []
  const transactionRows = transactions.data ?? []
  const memberIds = [
    ...eventRows.flatMap((row) => (row.suggested_member_id ? [row.suggested_member_id] : [])),
    ...intentRows.map((row) => row.member_id),
    ...transactionRows.flatMap((row) => (row.member_id ? [row.member_id] : [])),
  ]
  const { data: members } = memberIds.length
    ? await supabase.from('members').select('id, display_name, member_code').in('id', [...new Set(memberIds)])
    : { data: [] }
  const memberName = new Map((members ?? []).map((member) => [member.id, `${member.display_name ?? 'Thành viên'} (${member.member_code})`]))
  const accountName = new Map((accounts.data ?? []).map((account) => [account.id, account.name]))
  const categoryName = new Map((categories.data ?? []).map((category) => [category.id, category.name]))
  const intentRef = new Map(intentRows.map((row) => [row.id, row.ref]))

  const eventIds = eventRows.map((row) => row.id)
  const { data: linked } = eventIds.length
    ? await supabase.from('fund_transactions').select('id, bank_event_id').in('bank_event_id', eventIds)
    : { data: [] }
  const transactionOfEvent = new Map((linked ?? []).flatMap((row) => (row.bank_event_id ? [[row.bank_event_id, row.id] as const] : [])))

  return {
    balances: (balances.data ?? []).flatMap((row) =>
      row.account_id ? [{ accountId: row.account_id, name: row.name ?? '', kind: row.kind ?? '', balance: Number(row.balance ?? 0) }] : [],
    ),
    accounts: (accounts.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      bankBin: row.bank_bin ?? '',
      accountNo: row.account_no ?? '',
      accountName: row.account_name ?? '',
    })),
    categories: (categories.data ?? []).map((row) => ({ id: row.id, direction: direction(row.direction), name: row.name })),
    queue: eventRows.map((row) => ({
      id: row.id,
      status: row.match_status as BankEventStatus,
      amount: Number(row.amount),
      content: row.content,
      transferredAt: row.transferred_at,
      transactionId: transactionOfEvent.get(row.id) ?? null,
      suggestedMemberName: row.suggested_member_id ? (memberName.get(row.suggested_member_id) ?? null) : null,
      matchedRef: row.matched_intent_id ? (intentRef.get(row.matched_intent_id) ?? null) : null,
    })),
    openIntents: intentRows
      .filter((row) => row.method === 'bank')
      .map((row) => ({
        id: row.id,
        ref: row.ref,
        amount: Number(row.amount),
        memberName: memberName.get(row.member_id) ?? 'Thành viên',
        status: row.status,
      })),
    cashRequests: intentRows
      .filter((row) => row.status === 'cash_pending')
      .map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        memberName: memberName.get(row.member_id) ?? 'Thành viên',
        createdAt: row.created_at,
      })),
    transactions: transactionRows.map((row) => ({
      id: row.id,
      direction: direction(row.direction),
      amount: Number(row.amount),
      categoryName: (row.category_id && categoryName.get(row.category_id)) || 'Chưa phân loại',
      occurredAt: row.occurred_at,
      description: row.description,
      memberName: row.member_id ? (memberName.get(row.member_id) ?? null) : null,
      accountName: accountName.get(row.account_id) ?? '',
      receiptUrl: row.receipt_url,
      voidedAt: row.voided_at,
      voidReason: row.void_reason,
    })),
    reconciliations: (reconciliations.data ?? []).map((row) => ({
      id: row.id,
      accountName: accountName.get(row.account_id) ?? '',
      asOf: row.as_of,
      statementBalance: Number(row.statement_balance),
      appBalance: Number(row.app_balance),
      difference: Number(row.difference),
      note: row.note,
    })),
  }
}
