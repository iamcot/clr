import 'server-only'
import type { GoalType } from '@/config/challenges'
import type { CurrentMember } from '@/lib/auth/currentMember'
import { formatGoal } from '@/lib/challenges/describe'
import { daysLeft, describeRemaining } from '@/lib/home/challengeProgress'
import { monthNumberAt } from '@/lib/home/greeting'
import { formatPaceValue } from '@/lib/stats/format'
import { levelName } from '@/lib/stats/level'
import { getBackfillStatusText } from '@/lib/strava/syncStatus'
import { loadClubRankingRows } from '@/lib/stats/loadRankings'
import { loadOwnMonthAndYear } from '@/lib/stats/loadStatsPeriods'
import { buildRankingPage } from '@/lib/stats/ranking'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type HomeChallenge = {
  id: string
  title: string
  goalText: string
  progressPct: number
  completed: boolean
  remainingText: string
}

export type HomeSummary = {
  monthNumber: number
  level: number
  levelName: string
  monthDistanceMeters: number
  activityCount: number
  averagePace: string
  clubRank: number | null
  mainChallenge: HomeChallenge | null
  unpaidAmount: number
  unpaidReason: string
  syncNotice: string | null
}

async function loadMainChallenge(memberId: string, now: Date): Promise<HomeChallenge | null> {
  const supabase = await createSupabaseServerClient()
  const nowIso = now.toISOString()
  const { data } = await supabase
    .from('challenge_entries')
    .select(
      'value, progress_pct, completed, challenge_categories!inner(goal_value), challenges!inner(id, title, goal_type, status, starts_at, ends_at)',
    )
    .eq('member_id', memberId)
    .eq('excluded', false)
    .in('challenges.status', ['published', 'running'])
    .lte('challenges.starts_at', nowIso)
    .gte('challenges.ends_at', nowIso)
    .order('ends_at', { referencedTable: 'challenges', ascending: true })
    .limit(1)
  const row = data?.[0]
  if (!row) return null
  const goalType = row.challenges.goal_type as GoalType
  const goalValue = Number(row.challenge_categories.goal_value)
  return {
    id: row.challenges.id,
    title: row.challenges.title,
    goalText: formatGoal(goalType, goalValue),
    progressPct: Number(row.progress_pct),
    completed: row.completed,
    remainingText: describeRemaining(goalType, goalValue, Number(row.value), daysLeft(row.challenges.ends_at, now)),
  }
}

async function loadUnpaid(memberId: string): Promise<{ amount: number; reason: string }> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('penalties')
    .select('amount, reason')
    .eq('member_id', memberId)
    .eq('status', 'unpaid')
    .order('created_at', { ascending: false })
  const rows = data ?? []
  return {
    amount: rows.reduce((sum, row) => sum + Number(row.amount), 0),
    reason: rows[0]?.reason ?? '',
  }
}

async function loadOwnClubRank(memberId: string): Promise<number | null> {
  const rows = await loadClubRankingRows()
  const page = buildRankingPage(rows, 'level', { gender: null, memberType: null }, memberId, 1, 1)
  return page.rows.find((row) => row.memberId === memberId)?.rank ?? page.ownRow?.rank ?? null
}

export async function loadHomeSummary(member: CurrentMember, now: Date): Promise<HomeSummary> {
  const [stats, mainChallenge, unpaid, clubRank, syncNotice] = await Promise.all([
    loadOwnMonthAndYear(member.id, now),
    loadMainChallenge(member.id, now),
    loadUnpaid(member.id),
    loadOwnClubRank(member.id),
    getBackfillStatusText(member.id),
  ])
  return {
    monthNumber: monthNumberAt(now),
    level: member.level,
    levelName: levelName(member.level),
    monthDistanceMeters: stats.month.distanceMeters,
    activityCount: stats.month.activityCount,
    averagePace: formatPaceValue(stats.month.distanceMeters, stats.month.movingTimeSeconds),
    clubRank,
    mainChallenge,
    unpaidAmount: unpaid.amount,
    unpaidReason: unpaid.reason,
    syncNotice,
  }
}
