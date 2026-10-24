import 'server-only'
import { MAX_ENTRIES_IN_LIST } from '@/config/challenges'
import { scoreEntry } from '@/lib/challenges/score'
import { loadScoringActivities } from '@/lib/challenges/recompute'
import type { ChallengeRow } from '@/lib/challenges/loadChallenges'
import { parseActivityFilter } from '@/lib/challenges/filter'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { GoalType } from '@/config/challenges'

export type RankingRowData = {
  memberId: string
  categoryId: string
  value: number
  progressPct: number
  completed: boolean
  rank: number | null
}

export type MyEntry = RankingRowData & {
  excluded: boolean
  excludedReason: string | null
}

export async function loadRankingRows(
  challengeId: string,
): Promise<{ rows: RankingRowData[]; names: Record<string, string> }> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('challenge_entries')
    .select('member_id, category_id, value, progress_pct, completed, rank')
    .eq('challenge_id', challengeId)
    .eq('excluded', false)
    .range(0, MAX_ENTRIES_IN_LIST - 1)
  const rows = (data ?? []).map((row) => ({
    memberId: row.member_id,
    categoryId: row.category_id,
    value: Number(row.value),
    progressPct: Number(row.progress_pct),
    completed: row.completed,
    rank: row.rank,
  }))
  const ids = rows.map((row) => row.memberId)
  const names = await loadNames(ids)
  return { rows, names }
}

export async function loadNames(memberIds: string[]): Promise<Record<string, string>> {
  if (memberIds.length === 0) return {}
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members_public').select('id, display_name').in('id', memberIds)
  return Object.fromEntries((data ?? []).map((member) => [member.id, member.display_name ?? 'Thành viên']))
}

export async function loadMyEntry(challengeId: string, memberId: string): Promise<MyEntry | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('member_id', memberId)
    .maybeSingle()
  if (!data) return null
  return {
    memberId,
    categoryId: data.category_id,
    value: Number(data.value),
    progressPct: Number(data.progress_pct),
    completed: data.completed,
    rank: data.rank,
    excluded: data.excluded,
    excludedReason: data.excluded_reason,
  }
}

// Buổi được tính và buổi bị loại kèm lý do, tính trực tiếp từ hoạt động của chính mình
export async function explainMyActivities(challenge: ChallengeRow, goalValue: number, memberId: string) {
  const supabase = await createSupabaseServerClient()
  const activities = await loadScoringActivities(supabase, memberId, challenge.starts_at, challenge.ends_at)
  const result = scoreEntry(
    {
      startsAt: challenge.starts_at,
      endsAt: challenge.ends_at,
      goalType: challenge.goal_type as GoalType,
      filter: parseActivityFilter(challenge.activity_filter),
    },
    goalValue,
    activities,
  )
  const names = await loadActivityNames(activities.map((activity) => activity.id))
  const byId = new Map(activities.map((activity) => [activity.id, activity]))
  return {
    counted: result.counted.flatMap((item) => {
      const activity = byId.get(item.activityId)
      return activity
        ? [
            {
              activity,
              name: names.get(item.activityId) ?? '',
              countedValue: item.countedValue,
            },
          ]
        : []
    }),
    excluded: result.excluded.flatMap((item) => {
      const activity = byId.get(item.activityId)
      return activity
        ? [
            {
              activity,
              name: names.get(item.activityId) ?? '',
              reason: item.reason,
            },
          ]
        : []
    }),
  }
}

async function loadActivityNames(ids: number[]): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('activities').select('id, name').in('id', ids)
  return new Map((data ?? []).map((row) => [row.id, row.name]))
}
