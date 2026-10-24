import 'server-only'
import { assembleFundReport, type FundReport } from '@/lib/finance/report'
import type { ReportPeriod } from '@/lib/finance/period'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { MonthlyFlow } from '@/lib/finance/chart'

export type PenaltyReport = {
  issuedCount: number
  issuedAmount: number
  collectedAmount: number
  outstandingAmount: number
  waivedAmount: number
}

export type PublicExpense = {
  id: string
  occurredAt: string
  description: string
  amount: number
  category: string
  receiptUrl: string | null
}

export async function loadFundReport(from: string, to: string): Promise<FundReport> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('fund_report_rows', { p_from: from, p_to: to })
  return assembleFundReport((data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })))
}

// Số dư quỹ ở thời điểm hiện tại = số dư đầu kỳ của một kỳ bắt đầu từ bây giờ
export async function loadCurrentBalance(now: Date): Promise<number> {
  const report = await loadFundReport(now.toISOString(), now.toISOString())
  return report.opening
}

export async function loadPenaltyReport(period: ReportPeriod): Promise<PenaltyReport> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('fund_penalty_report', { p_from: period.from, p_to: period.to })
  const row = data?.[0]
  return {
    issuedCount: Number(row?.issued_count ?? 0),
    issuedAmount: Number(row?.issued_amount ?? 0),
    collectedAmount: Number(row?.collected_amount ?? 0),
    outstandingAmount: Number(row?.outstanding_amount ?? 0),
    waivedAmount: Number(row?.waived_amount ?? 0),
  }
}

export async function loadMonthlyFlows(months: number): Promise<MonthlyFlow[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('fund_monthly', { p_months: months })
  return (data ?? []).map((row) => ({ month: row.month, income: Number(row.income), expense: Number(row.expense) }))
}

export async function loadPublicExpenses(period: ReportPeriod): Promise<PublicExpense[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('fund_public_expenses', { p_from: period.from, p_to: period.to })
  return (data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    receiptUrl: row.receipt_url,
  }))
}

export type MonthLock = { lockedAt: string; note: string }

export async function loadMonthLock(monthStartDate: string): Promise<MonthLock | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('fund_period_locks')
    .select('locked_at, note')
    .eq('month', monthStartDate)
    .is('unlocked_at', null)
    .maybeSingle()
  return data ? { lockedAt: data.locked_at, note: data.note } : null
}

export async function loadCloseAutopostEnabled(): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'fund_close_autopost').maybeSingle()
  return data?.value !== false
}
