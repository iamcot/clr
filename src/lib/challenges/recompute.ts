import 'server-only'
import { parseActivityFilter } from '@/lib/challenges/filter'
import { scoreEntry } from '@/lib/challenges/score'
import type { ScoringActivity, ScoringChallenge } from '@/lib/challenges/types'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { GoalType } from '@/config/challenges'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>
export type ScoringDb = Pick<ServiceClient, 'from'>

const CONCURRENT_ENTRIES = 10
const RECOMPUTED_STATUSES = ['published', 'running', 'finalizing']

function throwOnError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`)
}

export type ChallengeContext = {
  id: string
  scoring: ScoringChallenge
  status: string
  goalByCategory: Map<string, number>
}

export async function loadChallengeContext(db: ServiceClient, challengeId: string): Promise<ChallengeContext | null> {
  const [challenge, categories] = await Promise.all([
    db.from('challenges').select('*').eq('id', challengeId).maybeSingle(),
    db.from('challenge_categories').select('id, goal_value').eq('challenge_id', challengeId),
  ])
  throwOnError(challenge.error, 'Không đọc được challenge')
  throwOnError(categories.error, 'Không đọc được hạng mục')
  if (!challenge.data) return null
  return {
    id: challengeId,
    status: challenge.data.status,
    scoring: {
      startsAt: challenge.data.starts_at,
      endsAt: challenge.data.ends_at,
      goalType: challenge.data.goal_type as GoalType,
      filter: parseActivityFilter(challenge.data.activity_filter),
    },
    goalByCategory: new Map((categories.data ?? []).map((category) => [category.id, Number(category.goal_value)])),
  }
}

// Hoạt động được xét: hợp lệ cho CLB, và hoạt động riêng tư chỉ khi thành viên cho phép cộng vào tổng
export async function loadScoringActivities(
  db: ScoringDb,
  memberId: string,
  startsAt: string,
  endsAt: string,
): Promise<ScoringActivity[]> {
  const [member, activities] = await Promise.all([
    db.from('members').select('share_private_in_totals').eq('id', memberId).maybeSingle(),
    db
      .from('activities')
      .select(
        'id, start_date, distance_m, moving_time_s, elapsed_time_s, elevation_gain_m, sport_type, private, visibility',
      )
      .eq('member_id', memberId)
      .eq('counts_for_club', true)
      .gte('start_date', startsAt)
      .lte('start_date', endsAt),
  ])
  throwOnError(activities.error, 'Không đọc được hoạt động')
  const includePrivate = member.data?.share_private_in_totals ?? false
  return (activities.data ?? [])
    .filter((row) => includePrivate || !(row.private || row.visibility === 'only_me'))
    .map((row) => ({
      id: row.id,
      startDate: row.start_date,
      distanceMeters: row.distance_m,
      movingTimeSeconds: row.moving_time_s,
      elapsedTimeSeconds: row.elapsed_time_s,
      elevationGainMeters: Number(row.elevation_gain_m),
      sportType: row.sport_type,
    }))
}

async function recomputeEntry(db: ServiceClient, context: ChallengeContext, memberId: string, categoryId: string) {
  const goal = context.goalByCategory.get(categoryId)
  if (goal === undefined) return
  const activities = await loadScoringActivities(db, memberId, context.scoring.startsAt, context.scoring.endsAt)
  const result = scoreEntry(context.scoring, goal, activities)

  const updated = await db
    .from('challenge_entries')
    .update({
      value: result.value,
      progress_pct: result.progressPct,
      completed: result.completed,
      completed_at: result.completedAt,
      last_activity_at: result.lastActivityAt,
    })
    .eq('challenge_id', context.id)
    .eq('member_id', memberId)
  throwOnError(updated.error, 'Không lưu được kết quả')

  const removed = await db
    .from('challenge_entry_activities')
    .delete()
    .eq('challenge_id', context.id)
    .eq('member_id', memberId)
  throwOnError(removed.error, 'Không xoá được buổi cũ')
  if (result.counted.length === 0) return
  const inserted = await db.from('challenge_entry_activities').insert(
    result.counted.map((item) => ({
      challenge_id: context.id,
      member_id: memberId,
      activity_id: item.activityId,
      counted_value: item.countedValue,
    })),
  )
  throwOnError(inserted.error, 'Không lưu được buổi được tính')
}

async function rankChallenge(db: ServiceClient, challengeId: string) {
  const ranked = await db.rpc('rank_challenge', {
    p_challenge_id: challengeId,
  })
  throwOnError(ranked.error, 'Không xếp hạng được')
}

export async function recomputeChallenge(db: ServiceClient, challengeId: string): Promise<number> {
  const context = await loadChallengeContext(db, challengeId)
  if (!context || context.status === 'closed') return 0

  const entries = await db
    .from('challenge_entries')
    .select('member_id, category_id')
    .eq('challenge_id', challengeId)
    .range(0, 4999)
  throwOnError(entries.error, 'Không đọc được danh sách tham gia')
  const rows = entries.data ?? []
  for (let start = 0; start < rows.length; start += CONCURRENT_ENTRIES) {
    await Promise.all(
      rows
        .slice(start, start + CONCURRENT_ENTRIES)
        .map((row) => recomputeEntry(db, context, row.member_id, row.category_id)),
    )
  }
  await rankChallenge(db, challengeId)
  return rows.length
}

// Gọi sau khi hoạt động của một người thay đổi; challenge đã chốt thì giữ nguyên kết quả
export async function recomputeChallengesForMember(db: ServiceClient, memberId: string): Promise<void> {
  const entries = await db
    .from('challenge_entries')
    .select('challenge_id, category_id, challenges!inner(status)')
    .eq('member_id', memberId)
    .in('challenges.status', RECOMPUTED_STATUSES)
  throwOnError(entries.error, 'Không đọc được challenge của thành viên')

  for (const entry of entries.data ?? []) {
    const context = await loadChallengeContext(db, entry.challenge_id)
    if (!context) continue
    await recomputeEntry(db, context, memberId, entry.category_id)
    await rankChallenge(db, entry.challenge_id)
  }
}
