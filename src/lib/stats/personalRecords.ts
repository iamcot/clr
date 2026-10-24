import { PR_DISTANCES } from '@/config/prDistances'

export type StravaPr = { distanceName: string; timeSeconds: number; activityId: number | null; date: string }
export type PrOverride = { distanceName: string; timeSeconds: number; source: 'manual' | 'race' }

export type PersonalRecord = {
  distanceName: string
  label: string
  timeSeconds: number
  source: 'strava' | 'manual' | 'race'
  activityId: number | null
  date: string | null
}

// Override do thành viên nhập (thường là thời gian chip) được ưu tiên hơn PR từ Strava
export function mergePersonalRecords(stravaPrs: StravaPr[], overrides: PrOverride[]): PersonalRecord[] {
  const records: PersonalRecord[] = []
  for (const distance of PR_DISTANCES) {
    const override = overrides.find((item) => item.distanceName === distance.name)
    const strava = stravaPrs.find((item) => item.distanceName === distance.name)
    if (override) {
      records.push({
        distanceName: distance.name,
        label: distance.label,
        timeSeconds: override.timeSeconds,
        source: override.source,
        activityId: null,
        date: null,
      })
    } else if (strava) {
      records.push({
        distanceName: distance.name,
        label: distance.label,
        timeSeconds: strava.timeSeconds,
        source: 'strava',
        activityId: strava.activityId,
        date: strava.date,
      })
    }
  }
  return records
}
