import 'server-only'
import { MAX_ENTRIES_IN_LIST, type ChallengeStatus } from '@/config/challenges'
import { parseActivityFilter } from '@/lib/challenges/filter'
import { parsePenaltyRule, parseRewardRule } from '@/lib/challenges/rules'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type ChallengeRow = Database['public']['Tables']['challenges']['Row']
export type CategoryRow = Database['public']['Tables']['challenge_categories']['Row']
export type EntryRow = Database['public']['Tables']['challenge_entries']['Row']

export type EntryWithMember = EntryRow & {
  displayName: string
  memberType: string | null
}

export async function loadChallenges(statuses?: ChallengeStatus[]): Promise<ChallengeRow[]> {
  const supabase = await createSupabaseServerClient()
  const query = supabase.from('challenges').select('*').order('starts_at', { ascending: false })
  const { data } = await (statuses ? query.in('status', statuses) : query)
  return data ?? []
}

export async function loadChallenge(id: string) {
  const supabase = await createSupabaseServerClient()
  const [challenge, categories] = await Promise.all([
    supabase.from('challenges').select('*').eq('id', id).maybeSingle(),
    supabase.from('challenge_categories').select('*').eq('challenge_id', id).order('sort'),
  ])
  if (!challenge.data) return null
  return {
    challenge: challenge.data,
    categories: categories.data ?? [],
    filter: parseActivityFilter(challenge.data.activity_filter),
    penaltyRule: parsePenaltyRule(challenge.data.penalty_rule),
    rewardRule: parseRewardRule(challenge.data.reward_rule),
  }
}

export async function loadEntries(challengeId: string, nameQuery?: string): Promise<EntryWithMember[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('challenge_entries')
    .select('*, members(display_name, member_type)')
    .eq('challenge_id', challengeId)
    .range(0, MAX_ENTRIES_IN_LIST - 1)
  const needle = nameQuery?.trim().toLowerCase()
  return (data ?? [])
    .map((row) => ({
      ...row,
      displayName: row.members?.display_name ?? 'Thành viên',
      memberType: row.members?.member_type ?? null,
    }))
    .filter((row) => !needle || row.displayName.toLowerCase().includes(needle))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.displayName.localeCompare(b.displayName, 'vi'))
}

export async function loadTemplateChallengeId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'challenge_template_id').maybeSingle()
  return typeof data?.value === 'string' ? data.value : null
}
