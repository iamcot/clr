import 'server-only'
import { FRIEND_FEED_LIMIT } from '@/config/members'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canShowOthersActivities } from '@/lib/settings/clubDisplayMode'
import { loadClubDisplayMode } from '@/lib/settings/loadClubDisplayMode'

export type FriendActivity = {
  id: number
  friendName: string
  distanceMeters: number
  startDate: string
}

export async function loadFriendFeed(memberId: string, before: string | null): Promise<FriendActivity[]> {
  if (!canShowOthersActivities(await loadClubDisplayMode())) return []

  const supabase = await createSupabaseServerClient()
  const { data: follows } = await supabase.from('follows').select('followee_id').eq('follower_id', memberId)
  const friendIds = (follows ?? []).map((row) => row.followee_id)
  if (friendIds.length === 0) return []

  let activityQuery = supabase
    .from('activities_club')
    .select('id, member_id, distance_m, start_date')
    .in('member_id', friendIds)
    .eq('counts_for_club', true)
    .order('start_date', { ascending: false })
    .limit(FRIEND_FEED_LIMIT)
  if (before) activityQuery = activityQuery.lt('start_date', before)
  const [activities, friends] = await Promise.all([
    activityQuery,
    supabase.from('members_public').select('id, display_name').in('id', friendIds),
  ])
  const friendNames = new Map((friends.data ?? []).map((friend) => [friend.id, friend.display_name ?? 'Thành viên']))
  return (activities.data ?? []).map((activity) => ({
    id: activity.id,
    friendName: friendNames.get(activity.member_id) ?? 'Thành viên',
    distanceMeters: activity.distance_m,
    startDate: activity.start_date,
  }))
}
