import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { suggestRaceActivity } from '@/lib/races/suggestActivity'

export type RaceResultView = {
  id: string
  memberId: string
  raceName: string
  raceDate: string
  city: string | null
  organizer: string | null
  url: string | null
  distanceLabel: string
  distanceMeters: number
  chipTimeSeconds: number
  gunTimeSeconds: number | null
  rankOverall: number | null
  rankAgeGroup: number | null
  bib: string | null
  certificateUrl: string | null
  activityId: number | null
  verified: boolean
  suggestedActivityId: number | null
}

const RACE_NAME_SUGGESTION_LIMIT = 300

export async function loadRaceResults(memberId: string, limit?: number): Promise<RaceResultView[]> {
  const supabase = await createSupabaseServerClient()
  const query = supabase
    .from('race_results')
    .select('*, races(name, race_date, city, organizer, url)')
    .eq('member_id', memberId)
  const { data } = await query.order('created_at', { ascending: false })
  const results = (data ?? [])
    .flatMap((row) => {
      const race = row.races
      if (!race) return []
      return [
        {
          id: row.id,
          memberId: row.member_id,
          raceName: race.name,
          raceDate: race.race_date,
          city: race.city,
          organizer: race.organizer,
          url: race.url,
          distanceLabel: row.distance_label,
          distanceMeters: row.distance_m,
          chipTimeSeconds: row.chip_time_s,
          gunTimeSeconds: row.gun_time_s,
          rankOverall: row.rank_overall,
          rankAgeGroup: row.rank_age_group,
          bib: row.bib,
          certificateUrl: row.certificate_url,
          activityId: row.activity_id,
          verified: row.verified_at !== null,
          suggestedActivityId: null,
        },
      ]
    })
    .sort((a, b) => b.raceDate.localeCompare(a.raceDate))
  return limit ? results.slice(0, limit) : results
}

// Chỉ dùng cho chính chủ: hoạt động Strava của mình
export async function addActivitySuggestions(memberId: string, results: RaceResultView[]): Promise<RaceResultView[]> {
  const unlinked = results.filter((result) => result.activityId === null)
  if (unlinked.length === 0) return results

  const supabase = await createSupabaseServerClient()
  const dates = unlinked.map((result) => result.raceDate).sort()
  const { data } = await supabase
    .from('activities')
    .select('id, start_date_local, distance_m')
    .eq('member_id', memberId)
    .gte('start_date_local', `${dates[0]}T00:00:00`)
    .lte('start_date_local', `${dates[dates.length - 1]}T23:59:59`)
  const candidates = (data ?? []).map((row) => ({
    id: row.id,
    startDateLocal: row.start_date_local,
    distanceMeters: row.distance_m,
  }))
  return results.map((result) => ({
    ...result,
    suggestedActivityId:
      result.activityId === null
        ? (suggestRaceActivity(result.raceDate, result.distanceMeters, candidates)?.id ?? null)
        : null,
  }))
}

export async function loadRaceNameSuggestions(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('races')
    .select('name')
    .order('created_at', { ascending: false })
    .limit(RACE_NAME_SUGGESTION_LIMIT)
  return [...new Set((data ?? []).map((row) => row.name))]
}

export async function loadRaceResult(memberId: string, resultId: string): Promise<RaceResultView | null> {
  const results = await loadRaceResults(memberId)
  return results.find((result) => result.id === resultId) ?? null
}
