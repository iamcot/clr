import 'server-only'
import type { GoalType } from '@/config/challenges'
import { HOME_CHALLENGE_LIMIT } from '@/config/members'
import type { CurrentMember } from '@/lib/auth/currentMember'
import { formatGoal } from '@/lib/challenges/describe'
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
}

export type HomeSummary = {
  monthNumber: number
  level: number
  levelName: string
  monthDistanceMeters: number
  activityCount: number
  averagePace: string
  clubRank: number | null
  challenges: HomeChallenge[]
  unpaidAmount: number
  unpaidReason: string
  syncNotice: string | null
}

async function loadHomeChallenges(memberId: string, now: Date): Promise<HomeChallenge[]> {
  const supabase = await createSupabaseServerClient()
  const nowIso = now.toISOString()
  const { data } = await supabase
    .from('challenge_entries')
    .select(
      'progress_pct, completed, challenge_categories!inner(goal_value), challenges!inner(id, title, goal_type, status, starts_at, ends_at)',
    )
    .eq('member_id', memberId)
    .eq('excluded', false)
    .in('challenges.status', ['published', 'running'])
    .lte('challenges.starts_at', nowIso)
    .gte('challenges.ends_at', nowIso)
  // Sắp theo hạn kết thúc ở đây vì order trên bảng nhúng không sắp lại các dòng cha
  const soonestFirst = [...(data ?? [])].sort((a, b) => a.challenges.ends_at.localeCompare(b.challenges.ends_at))
  return soonestFirst.slice(0, HOME_CHALLENGE_LIMIT).map((row) => ({
    id: row.challenges.id,
    title: row.challenges.title,
    goalText: formatGoal(row.challenges.goal_type as GoalType, Number(row.challenge_categories.goal_value)),
    progressPct: Number(row.progress_pct),
    completed: row.completed,
  }))
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
  const rows = await loadClubRankingRows(false)
  const page = buildRankingPage(rows, 'level', { gender: null, memberType: null }, memberId, 1, 1)
  return page.rows.find((row) => row.memberId === memberId)?.rank ?? page.ownRow?.rank ?? null
}

export async function loadHomeSummary(member: CurrentMember, now: Date): Promise<HomeSummary> {
  const [stats, challenges, unpaid, clubRank, syncNotice] = await Promise.all([
    loadOwnMonthAndYear(member.id, now),
    loadHomeChallenges(member.id, now),
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
    challenges,
    unpaidAmount: unpaid.amount,
    unpaidReason: unpaid.reason,
    syncNotice,
  }
}
