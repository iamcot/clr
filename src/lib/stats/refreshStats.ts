import 'server-only'
import { LEVEL_WINDOW_MONTHS, MEMBER_BATCH_SIZE } from '@/config/levels'
import { computeClubPoints, computeLevel } from '@/lib/stats/level'
import { buildLevelInput, levelWindowStart, type MonthStatsRow } from '@/lib/stats/levelInput'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

function throwOnError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`)
}

async function loadMonthRows(db: ServiceClient, memberIds: string[], windowStart: string): Promise<MonthStatsRow[]> {
  const { data, error } = await db
    .from('member_stats_period')
    .select('member_id, period_start, distance_m, active_days')
    .in('member_id', memberIds)
    .eq('period_type', 'month')
    .gte('period_start', windowStart)
  throwOnError(error, 'Không đọc được thống kê tháng')
  return (data ?? []).map((row) => ({
    memberId: row.member_id,
    periodStart: row.period_start,
    distanceMeters: row.distance_m,
    activeDays: row.active_days,
  }))
}

async function loadPrNames(db: ServiceClient, memberIds: string[]): Promise<Map<string, string[]>> {
  const [strava, overrides] = await Promise.all([
    db.from('member_prs').select('member_id, distance_name').in('member_id', memberIds),
    db.from('pr_overrides').select('member_id, distance_name').in('member_id', memberIds),
  ])
  throwOnError(strava.error, 'Không đọc được PR Strava')
  throwOnError(overrides.error, 'Không đọc được PR ghi đè')

  const namesByMember = new Map<string, string[]>()
  for (const row of [...(strava.data ?? []), ...(overrides.data ?? [])]) {
    if (!row.member_id || !row.distance_name) continue
    namesByMember.set(row.member_id, [...(namesByMember.get(row.member_id) ?? []), row.distance_name])
  }
  return namesByMember
}

async function saveLevel(db: ServiceClient, memberId: string, level: number, clubPoints: number, levelChanged: boolean) {
  const update = levelChanged
    ? { level, club_points: clubPoints, level_updated_at: new Date().toISOString() }
    : { club_points: clubPoints }
  const { error } = await db.from('members').update(update).eq('id', memberId)
  throwOnError(error, 'Không lưu được level')
}

// Tính lại level và điểm CLB từ bảng tổng hợp đã có (chưa tính lại bảng tổng hợp)
export async function recomputeLevels(db: ServiceClient, memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) return
  const windowStart = levelWindowStart(new Date(), LEVEL_WINDOW_MONTHS)
  const [monthRows, prNames, members] = await Promise.all([
    loadMonthRows(db, memberIds, windowStart),
    loadPrNames(db, memberIds),
    db.from('members').select('id, level, club_points').in('id', memberIds),
  ])
  throwOnError(members.error, 'Không đọc được thành viên')

  for (const member of members.data ?? []) {
    const input = buildLevelInput(member.id, monthRows, prNames.get(member.id) ?? [], windowStart, 0)
    const level = computeLevel(input)
    const clubPoints = computeClubPoints(input)
    if (level === member.level && clubPoints === member.club_points) continue
    await saveLevel(db, member.id, level, clubPoints, level !== member.level)
  }
}

export async function refreshMemberStatsAndLevel(db: ServiceClient, memberId: string): Promise<void> {
  const refreshed = await db.rpc('refresh_member_stats', { p_member_id: memberId })
  throwOnError(refreshed.error, 'Không tính lại thống kê')
  await recomputeLevels(db, [memberId])
}

export type RecomputeAllResult = { membersRefreshed: number }

export async function recomputeAllStats(db: ServiceClient): Promise<RecomputeAllResult> {
  const refreshed = await db.rpc('refresh_all_member_stats')
  throwOnError(refreshed.error, 'Không tính lại thống kê')

  const { data, error } = await db.from('members').select('id').eq('status', 'active')
  throwOnError(error, 'Không đọc được danh sách thành viên')
  const ids = (data ?? []).map((member) => member.id)
  for (let start = 0; start < ids.length; start += MEMBER_BATCH_SIZE) {
    await recomputeLevels(db, ids.slice(start, start + MEMBER_BATCH_SIZE))
  }
  return { membersRefreshed: ids.length }
}
