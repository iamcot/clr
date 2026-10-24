import 'server-only'
import { loadOwnMonthAndYear } from '@/lib/stats/loadStatsPeriods'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type HomeSummary = {
  monthDistanceMeters: number
  mainChallenge: { id: string; title: string; progressPct: number; completed: boolean } | null
  unpaidAmount: number
}

async function loadMainChallenge(memberId: string, now: Date): Promise<HomeSummary['mainChallenge']> {
  const supabase = await createSupabaseServerClient()
  const nowIso = now.toISOString()
  const { data } = await supabase
    .from('challenge_entries')
    .select('progress_pct, completed, challenges!inner(id, title, status, starts_at, ends_at)')
    .eq('member_id', memberId)
    .eq('excluded', false)
    .in('challenges.status', ['published', 'running'])
    .lte('challenges.starts_at', nowIso)
    .gte('challenges.ends_at', nowIso)
    .order('ends_at', { referencedTable: 'challenges', ascending: true })
    .limit(1)
  const row = data?.[0]
  if (!row) return null
  return {
    id: row.challenges.id,
    title: row.challenges.title,
    progressPct: Number(row.progress_pct),
    completed: row.completed,
  }
}

async function loadUnpaidAmount(memberId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('penalties').select('amount').eq('member_id', memberId).eq('status', 'unpaid')
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
}

export async function loadHomeSummary(memberId: string, now: Date): Promise<HomeSummary> {
  const [stats, mainChallenge, unpaidAmount] = await Promise.all([
    loadOwnMonthAndYear(memberId, now),
    loadMainChallenge(memberId, now),
    loadUnpaidAmount(memberId),
  ])
  return { monthDistanceMeters: stats.month.distanceMeters, mainChallenge, unpaidAmount }
}
