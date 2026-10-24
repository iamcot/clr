import 'server-only'
import type { ReportPeriod } from '@/lib/finance/period'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PeriodTransaction = {
  occurredAt: string
  direction: 'in' | 'out'
  category: string
  description: string
  amount: number
  account: string
  voided: boolean
  voidReason: string | null
}

const EXPORT_LIMIT = 5000

// Cả giao dịch đã huỷ để bản xuất khớp với sổ; người đọc tự lọc theo cột trạng thái
export async function loadPeriodTransactions(period: ReportPeriod): Promise<PeriodTransaction[]> {
  const supabase = await createSupabaseServerClient()
  const [transactions, accounts, categories] = await Promise.all([
    supabase
      .from('fund_transactions')
      .select('*')
      .gte('occurred_at', period.from)
      .lt('occurred_at', period.to)
      .order('occurred_at')
      .range(0, EXPORT_LIMIT - 1),
    supabase.from('fund_accounts').select('id, name'),
    supabase.from('fund_categories').select('id, name'),
  ])
  const accountName = new Map((accounts.data ?? []).map((account) => [account.id, account.name]))
  const categoryName = new Map((categories.data ?? []).map((category) => [category.id, category.name]))
  return (transactions.data ?? []).map((row) => ({
    occurredAt: row.occurred_at,
    direction: row.direction === 'out' ? 'out' : 'in',
    category: (row.category_id && categoryName.get(row.category_id)) || 'Chưa phân loại',
    description: row.description,
    amount: Number(row.amount),
    account: accountName.get(row.account_id) ?? '',
    voided: row.voided_at !== null,
    voidReason: row.void_reason,
  }))
}
