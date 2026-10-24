import 'server-only'
import { RECORD_RESULTS_LIMIT } from '@/config/hallOfFame'
import type { RecordResult } from '@/lib/hallOfFame/records'
import type { createSupabaseServerClient } from '@/lib/supabase/server'

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>

// Chỉ lấy kết quả giải đã được BCN xác minh; view chỉ lộ tuổi lúc chạy, không lộ năm sinh
export async function loadVerifiedRecordResults(supabase: Client): Promise<RecordResult[]> {
  const { data: rows } = await supabase
    .from('hall_of_fame_records')
    .select('*')
    .order('chip_time_s', { ascending: true })
    .limit(RECORD_RESULTS_LIMIT)
  return (rows ?? []).flatMap((row) => {
    if (!row.id || !row.member_id || row.distance_m === null || row.chip_time_s === null || !row.race_name || !row.race_date) {
      return []
    }
    return [
      {
        id: row.id,
        memberId: row.member_id,
        displayName: row.display_name ?? 'Thành viên',
        avatarUrl: row.avatar_url,
        gender: row.gender,
        ageAtRace: row.age_at_race,
        distanceMeters: row.distance_m,
        chipTimeSeconds: row.chip_time_s,
        raceName: row.race_name,
        raceDate: row.race_date,
      },
    ]
  })
}
