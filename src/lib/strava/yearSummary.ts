import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { summarizeMonthAndYear } from '@/lib/stats/activitySummary'

const LOCAL_UTC_OFFSET_HOURS = 7

function currentLocalIso(): string {
  return new Date(Date.now() + LOCAL_UTC_OFFSET_HOURS * 3600 * 1000).toISOString()
}

// Số liệu nhanh của chính mình; task 06 sẽ thay bằng bảng tổng hợp
export async function loadOwnMonthAndYearSummary(memberId: string) {
  const todayLocal = currentLocalIso()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('activities')
    .select('start_date_local, distance_m, moving_time_s')
    .eq('member_id', memberId)
    .eq('counts_for_club', true)
    .gte('start_date_local', `${todayLocal.slice(0, 4)}-01-01T00:00:00`)
  const activities = (data ?? []).map((row) => ({
    startDateLocal: row.start_date_local,
    distanceMeters: row.distance_m,
    movingTimeSeconds: row.moving_time_s,
  }))
  return summarizeMonthAndYear(activities, todayLocal)
}
