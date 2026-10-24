import 'server-only'
import type { RankingRow } from '@/lib/stats/ranking'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// View đã lọc: chỉ người bật chia sẻ, và rỗng nếu CLB không để chế độ full_opt_in
export async function loadClubRankingRows(): Promise<RankingRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('club_rankings').select('*')
  return (data ?? []).flatMap((row) => {
    if (!row.member_id) return []
    return [
      {
        memberId: row.member_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        memberType: row.member_type,
        gender: row.gender,
        level: row.level ?? 1,
        clubPoints: row.club_points ?? 0,
        monthDistanceMeters: row.month_distance_m ?? 0,
        yearDistanceMeters: row.year_distance_m ?? 0,
      },
    ]
  })
}
