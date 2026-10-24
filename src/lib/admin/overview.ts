import 'server-only'
import { OVERVIEW_ACTIVITY_DAYS } from '@/config/members'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000
const FUND_QUEUE_STATUSES = ['mismatch', 'needs_review', 'unmatched', 'duplicate']

export type AdminOverview = {
  activeMembers: number
  pendingMembers: number
  recentActivities: number
  runningChallenges: number
  fundBalance: number
  unpaidPenaltyCount: number
  unpaidPenaltyAmount: number
  fundQueueCount: number
}

export async function loadAdminOverview(now: Date): Promise<AdminOverview> {
  const supabase = await createSupabaseServerClient()
  const since = new Date(now.getTime() - OVERVIEW_ACTIVITY_DAYS * DAY_MS).toISOString()
  const [active, pending, activities, challenges, balances, unpaid, queue] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('activities_review')
      .select('id', { count: 'exact', head: true })
      .eq('counts_for_club', true)
      .gte('start_date', since),
    supabase.from('challenges').select('id', { count: 'exact', head: true }).eq('status', 'running'),
    supabase.from('fund_balances').select('balance'),
    supabase.from('penalties').select('amount').eq('status', 'unpaid'),
    supabase
      .from('bank_webhook_events')
      .select('id', { count: 'exact', head: true })
      .in('match_status', FUND_QUEUE_STATUSES),
  ])
  const unpaidRows = unpaid.data ?? []
  return {
    activeMembers: active.count ?? 0,
    pendingMembers: pending.count ?? 0,
    recentActivities: activities.count ?? 0,
    runningChallenges: challenges.count ?? 0,
    fundBalance: (balances.data ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0),
    unpaidPenaltyCount: unpaidRows.length,
    unpaidPenaltyAmount: unpaidRows.reduce((sum, row) => sum + Number(row.amount), 0),
    fundQueueCount: queue.count ?? 0,
  }
}
