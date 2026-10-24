import 'server-only'
import { HIGHLIGHT_LIMIT, HIGHLIGHT_WINDOW_DAYS } from '@/config/members'
import {
  describeHonor,
  describePr,
  describeRace,
  isWithinDays,
  mergeHighlights,
  type HighlightItem,
} from '@/lib/members/highlights'
import { canShowOthersActivities } from '@/lib/settings/clubDisplayMode'
import { loadClubDisplayMode } from '@/lib/settings/loadClubDisplayMode'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>
type NamedItem = Omit<HighlightItem, 'memberName'>

async function loadFollowingIds(supabase: Client, memberId: string): Promise<string[]> {
  const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', memberId)
  return (data ?? []).map((row) => row.followee_id)
}

async function loadHonorItems(supabase: Client, friendIds: string[], now: Date): Promise<NamedItem[]> {
  const { data } = await supabase
    .from('honors')
    .select('id, member_id, title, honor_date')
    .in('member_id', friendIds)
    .eq('approved', true)
    .order('honor_date', { ascending: false })
    .limit(HIGHLIGHT_LIMIT)
  return (data ?? [])
    .filter((row) => isWithinDays(`${row.honor_date}T00:00:00+07:00`, HIGHLIGHT_WINDOW_DAYS, now))
    .map((row) => ({
      id: `honor-${row.id}`,
      memberId: row.member_id,
      kind: 'honor' as const,
      text: describeHonor(row.title),
      date: row.honor_date,
    }))
}

async function loadRaceItems(supabase: Client, friendIds: string[], now: Date): Promise<NamedItem[]> {
  const { data } = await supabase
    .from('race_results')
    .select('id, member_id, distance_label, rank_overall, rank_age_group, races(name, race_date)')
    .in('member_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(HIGHLIGHT_LIMIT)
  return (data ?? []).flatMap((row) => {
    if (!row.races || !isWithinDays(`${row.races.race_date}T00:00:00+07:00`, HIGHLIGHT_WINDOW_DAYS, now)) return []
    return [
      {
        id: `race-${row.id}`,
        memberId: row.member_id,
        kind: 'race' as const,
        text: describeRace(row.distance_label, row.races.name, row.rank_overall, row.rank_age_group),
        date: row.races.race_date,
      },
    ]
  })
}

// PR nhập tay hoặc từ kết quả giải; PR Strava chỉ có khi CLB cho phép hiện hoạt động của người khác (view tự lọc người đồng ý)
async function loadPrItems(supabase: Client, friendIds: string[], now: Date): Promise<NamedItem[]> {
  const includeStrava = canShowOthersActivities(await loadClubDisplayMode())
  const [overrides, strava] = await Promise.all([
    supabase.from('pr_overrides').select('member_id, distance_name, time_s, created_at').in('member_id', friendIds),
    includeStrava
      ? supabase.from('member_prs_club').select('member_id, distance_name, elapsed_time_s, start_date').in('member_id', friendIds)
      : Promise.resolve({ data: [] }),
  ])
  const manual = (overrides.data ?? [])
    .filter((row) => isWithinDays(row.created_at, HIGHLIGHT_WINDOW_DAYS, now))
    .map((row) => ({
      id: `pr-${row.member_id}-${row.distance_name}`,
      memberId: row.member_id,
      kind: 'pr' as const,
      text: describePr(row.distance_name, row.time_s),
      date: row.created_at,
    }))
  const fromStrava = (strava.data ?? []).flatMap((row) => {
    if (!row.member_id || !row.distance_name || row.elapsed_time_s === null || !row.start_date) return []
    if (!isWithinDays(row.start_date, HIGHLIGHT_WINDOW_DAYS, now)) return []
    return [
      {
        id: `pr-${row.member_id}-${row.distance_name}`,
        memberId: row.member_id,
        kind: 'pr' as const,
        text: describePr(row.distance_name, row.elapsed_time_s),
        date: row.start_date,
      },
    ]
  })
  // PR nhập tay được ưu tiên hơn PR Strava cùng cự ly (khớp cách hồ sơ gộp PR)
  const manualIds = new Set(manual.map((item) => item.id))
  return [...manual, ...fromStrava.filter((item) => !manualIds.has(item.id))]
}

// Tin đáng chú ý của những người mình theo dõi: PR, danh hiệu, kết quả giải gần đây
export async function loadFollowingHighlights(memberId: string, now: Date): Promise<HighlightItem[]> {
  const supabase = await createSupabaseServerClient()
  const friendIds = await loadFollowingIds(supabase, memberId)
  if (friendIds.length === 0) return []

  const [honors, races, prs, friends] = await Promise.all([
    loadHonorItems(supabase, friendIds, now),
    loadRaceItems(supabase, friendIds, now),
    loadPrItems(supabase, friendIds, now),
    supabase.from('members_public').select('id, display_name').in('id', friendIds),
  ])
  const names = new Map((friends.data ?? []).map((friend) => [friend.id, friend.display_name ?? 'Thành viên']))
  const items = [...honors, ...races, ...prs].map((item) => ({ ...item, memberName: names.get(item.memberId) ?? 'Thành viên' }))
  return mergeHighlights(items, HIGHLIGHT_LIMIT)
}
