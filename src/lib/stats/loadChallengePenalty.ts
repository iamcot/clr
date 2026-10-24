import 'server-only'
import { summarizeChallengePenalty, type ChallengePenaltySummary, type OwnChallengeEntry } from '@/lib/stats/challengePenaltySummary'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type OwnChallengePenalty = { summary: ChallengePenaltySummary; entries: OwnChallengeEntry[] }

export async function loadOwnChallengePenalty(memberId: string): Promise<OwnChallengePenalty> {
  const supabase = await createSupabaseServerClient()
  const [entries, penalties] = await Promise.all([
    supabase
      .from('challenge_entries')
      .select('progress_pct, completed, challenges!inner(id, title, status, starts_at)')
      .eq('member_id', memberId)
      .eq('excluded', false)
      .neq('challenges.status', 'draft'),
    supabase.from('penalties').select('amount, status').eq('member_id', memberId),
  ])
  const newestFirst = [...(entries.data ?? [])].sort((a, b) => b.challenges.starts_at.localeCompare(a.challenges.starts_at))
  const ownEntries = newestFirst.map((row) => ({
    id: row.challenges.id,
    title: row.challenges.title,
    progressPct: Number(row.progress_pct),
    completed: row.completed,
  }))
  const ownPenalties = (penalties.data ?? []).map((row) => ({
    amount: Number(row.amount),
    status: row.status as 'unpaid' | 'paid' | 'waived',
  }))
  return { summary: summarizeChallengePenalty(ownEntries, ownPenalties), entries: ownEntries }
}
