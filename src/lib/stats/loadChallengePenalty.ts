import 'server-only'
import { summarizeChallengePenalty, type ChallengePenaltySummary, type OwnChallengeEntry } from '@/lib/stats/challengePenaltySummary'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type OwnChallengePenalty = { summary: ChallengePenaltySummary; entries: OwnChallengeEntry[] }

// Khoảng [from, to) theo ngày giờ Việt Nam; challenge tính nếu thời gian diễn ra giao với khoảng, phạt tính theo ngày tạo
export async function loadOwnChallengePenalty(memberId: string, fromDate: string, toDate: string): Promise<OwnChallengePenalty> {
  const supabase = await createSupabaseServerClient()
  const from = `${fromDate}T00:00:00+07:00`
  const to = `${toDate}T00:00:00+07:00`
  const [entries, penalties] = await Promise.all([
    supabase
      .from('challenge_entries')
      .select('progress_pct, completed, challenges!inner(id, title, status, starts_at)')
      .eq('member_id', memberId)
      .eq('excluded', false)
      .neq('challenges.status', 'draft')
      .lt('challenges.starts_at', to)
      .gte('challenges.ends_at', from),
    supabase
      .from('penalties')
      .select('amount, status')
      .eq('member_id', memberId)
      .gte('created_at', from)
      .lt('created_at', to),
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
