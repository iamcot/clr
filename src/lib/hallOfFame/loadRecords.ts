import 'server-only'
import { RECORD_RESULTS_LIMIT } from '@/config/hallOfFame'
import type { RecordResult } from '@/lib/hallOfFame/records'
import type { createSupabaseServerClient } from '@/lib/supabase/server'

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>

// Chỉ lấy kết quả giải đã được BCN xác minh
export async function loadVerifiedRecordResults(supabase: Client): Promise<RecordResult[]> {
  const { data: rows } = await supabase
    .from('race_results')
    .select('id, member_id, distance_m, chip_time_s, races(name, race_date)')
    .not('verified_at', 'is', null)
    .order('chip_time_s', { ascending: true })
    .limit(RECORD_RESULTS_LIMIT)
  if (!rows || rows.length === 0) return []

  const { data: members } = await supabase
    .from('members_public')
    .select('id, display_name, avatar_url, gender')
    .in(
      'id',
      rows.map((row) => row.member_id),
    )
  const memberById = new Map((members ?? []).map((member) => [member.id, member]))
  const { data: infos } = await supabase.from('record_member_info').select('id, birth_year')
  const birthYearById = new Map((infos ?? []).map((info) => [info.id, info.birth_year]))

  return rows.flatMap((row) => {
    const member = memberById.get(row.member_id)
    if (!member || !row.races) return []
    return [
      {
        id: row.id,
        memberId: row.member_id,
        displayName: member.display_name ?? 'Thành viên',
        avatarUrl: member.avatar_url,
        gender: member.gender,
        birthYear: birthYearById.get(row.member_id) ?? null,
        distanceMeters: row.distance_m,
        chipTimeSeconds: row.chip_time_s,
        raceName: row.races.name,
        raceDate: row.races.race_date,
      },
    ]
  })
}
