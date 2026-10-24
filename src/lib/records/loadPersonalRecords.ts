import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mergePersonalRecords, type PersonalRecord, type StravaPr } from '@/lib/stats/personalRecords'

type StravaPrRow = {
  distance_name: string | null
  elapsed_time_s: number | null
  activity_id?: number | null
  start_date: string | null
}

function toStravaPrs(rows: StravaPrRow[]): StravaPr[] {
  return rows.flatMap((row) => {
    if (!row.distance_name || row.elapsed_time_s === null || !row.start_date) return []
    return [
      {
        distanceName: row.distance_name,
        timeSeconds: row.elapsed_time_s,
        activityId: row.activity_id ?? null,
        date: row.start_date,
      },
    ]
  })
}

async function loadOverrides(memberId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('pr_overrides')
    .select('distance_name, time_s, source')
    .eq('member_id', memberId)
  return (data ?? []).map((row) => ({
    distanceName: row.distance_name,
    timeSeconds: row.time_s,
    source: row.source === 'race' ? ('race' as const) : ('manual' as const),
  }))
}

export async function loadOwnPersonalRecords(memberId: string): Promise<PersonalRecord[]> {
  const supabase = await createSupabaseServerClient()
  const [strava, overrides] = await Promise.all([
    supabase
      .from('member_prs')
      .select('distance_name, elapsed_time_s, activity_id, start_date')
      .eq('member_id', memberId),
    loadOverrides(memberId),
  ])
  return mergePersonalRecords(toStravaPrs(strava.data ?? []), overrides)
}

// Người khác: PR Strava chỉ có khi người đó đồng ý chia sẻ (view tự lọc) và CLB cho phép hiện (`includeStrava`)
export async function loadPublicPersonalRecords(memberId: string, includeStrava: boolean): Promise<PersonalRecord[]> {
  const supabase = await createSupabaseServerClient()
  const [strava, overrides] = await Promise.all([
    includeStrava
      ? supabase.from('member_prs_club').select('distance_name, elapsed_time_s, start_date').eq('member_id', memberId)
      : Promise.resolve({ data: [] as StravaPrRow[] }),
    loadOverrides(memberId),
  ])
  return mergePersonalRecords(toStravaPrs(strava.data ?? []), overrides)
}
