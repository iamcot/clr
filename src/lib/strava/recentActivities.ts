import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type OwnActivity = Pick<
  Database['public']['Tables']['activities']['Row'],
  'id' | 'name' | 'sport_type' | 'start_date' | 'distance_m' | 'moving_time_s' | 'counts_for_club' | 'flagged_invalid'
>

const RECENT_LIMIT = 20

export async function loadOwnRecentActivities(memberId: string): Promise<OwnActivity[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('activities')
    .select('id, name, sport_type, start_date, distance_m, moving_time_s, counts_for_club, flagged_invalid')
    .eq('member_id', memberId)
    .order('start_date', { ascending: false })
    .limit(RECENT_LIMIT)
  return data ?? []
}
