import 'server-only'
import { MAX_ENTRIES_IN_LIST } from '@/config/challenges'
import { MEMBER_TYPES } from '@/config/members'
import type { SummaryEntry } from '@/lib/challenges/summary'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const SUMMARY_ROW_LIMIT = MAX_ENTRIES_IN_LIST * 12
const VN_OFFSET = '+07:00'

export async function loadSummaryEntries(
  year: number,
  memberType: string | null,
): Promise<{ entries: SummaryEntry[]; names: Record<string, string> }> {
  const supabase = await createSupabaseServerClient()
  const query = supabase
    .from('challenge_entries')
    .select(
      'member_id, challenge_id, completed, excluded, challenges!inner(starts_at, status), members!inner(display_name, member_type)',
    )
    .eq('challenges.status', 'closed')
    .gte('challenges.starts_at', `${year}-01-01T00:00:00${VN_OFFSET}`)
    .lt('challenges.starts_at', `${year + 1}-01-01T00:00:00${VN_OFFSET}`)
    .range(0, SUMMARY_ROW_LIMIT - 1)
  const validType = MEMBER_TYPES.find((type) => type === memberType)
  const { data } = await (validType ? query.eq('members.member_type', validType) : query)
  const rows = data ?? []
  return {
    entries: rows.map((row) => ({
      memberId: row.member_id,
      challengeId: row.challenge_id,
      challengeStartsAt: row.challenges.starts_at,
      completed: row.completed,
      excluded: row.excluded,
    })),
    names: Object.fromEntries(rows.map((row) => [row.member_id, row.members.display_name ?? 'Thành viên'])),
  }
}
