import type { Database } from '@/lib/types/database'

type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type BestEffortInsert = Database['public']['Tables']['activity_best_efforts']['Insert']
type Visibility = ActivityInsert['visibility']

export type MappedActivity = ActivityInsert & Required<Pick<ActivityInsert, 'manual' | 'distance_m' | 'moving_time_s'>>

export type StravaActivityJson = Record<string, unknown>

const VISIBILITIES: readonly string[] = ['everyone', 'followers_only', 'only_me']

function readNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' && value !== '' ? value : null
}

function readBoolean(source: Record<string, unknown>, key: string): boolean {
  return source[key] === true
}

function readRoundedInt(source: Record<string, unknown>, key: string): number {
  return Math.round(readNumber(source, key) ?? 0)
}

function readPolyline(json: StravaActivityJson): string | null {
  const map = json.map
  if (typeof map !== 'object' || map === null) return null
  return readString(map as Record<string, unknown>, 'summary_polyline')
}

function readStartPoint(json: StravaActivityJson): string | null {
  const latlng = json.start_latlng
  if (!Array.isArray(latlng) || latlng.length !== 2) return null
  const [lat, lng] = latlng
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  return `(${lat},${lng})`
}

function readVisibility(json: StravaActivityJson): Visibility {
  const visibility = readString(json, 'visibility')
  if (visibility && VISIBILITIES.includes(visibility)) return visibility as Visibility
  return readBoolean(json, 'private') ? 'only_me' : 'everyone'
}

export function mapActivity(
  memberId: string,
  json: StravaActivityJson,
  options: { detailFetched: boolean },
): MappedActivity {
  const id = readNumber(json, 'id')
  const startDate = readString(json, 'start_date')
  const startDateLocal = readString(json, 'start_date_local')
  if (id === null || !startDate || !startDateLocal) throw new Error('Hoạt động Strava thiếu id hoặc thời gian bắt đầu')

  return {
    id,
    member_id: memberId,
    name: readString(json, 'name') ?? '',
    sport_type: readString(json, 'sport_type') ?? readString(json, 'type') ?? 'Workout',
    start_date: startDate,
    start_date_local: startDateLocal,
    timezone: readString(json, 'timezone'),
    distance_m: readRoundedInt(json, 'distance'),
    moving_time_s: readRoundedInt(json, 'moving_time'),
    elapsed_time_s: readRoundedInt(json, 'elapsed_time'),
    elevation_gain_m: readNumber(json, 'total_elevation_gain') ?? 0,
    average_heartrate: readNumber(json, 'average_heartrate'),
    max_heartrate: readNumber(json, 'max_heartrate'),
    average_cadence: readNumber(json, 'average_cadence'),
    manual: readBoolean(json, 'manual'),
    trainer: readBoolean(json, 'trainer'),
    visibility: readVisibility(json),
    private: readBoolean(json, 'private'),
    summary_polyline: readPolyline(json),
    start_latlng: readStartPoint(json),
    detail_fetched: options.detailFetched,
    raw: json as ActivityInsert['raw'],
  }
}

export function mapBestEfforts(activityId: number, json: StravaActivityJson): BestEffortInsert[] {
  const efforts = Array.isArray(json.best_efforts) ? json.best_efforts : []
  return efforts.flatMap((effort): BestEffortInsert[] => {
    if (typeof effort !== 'object' || effort === null) return []
    const record = effort as Record<string, unknown>
    const name = readString(record, 'name')
    const distance = readNumber(record, 'distance')
    const elapsed = readNumber(record, 'elapsed_time')
    if (!name || distance === null || elapsed === null) return []
    return [
      {
        activity_id: activityId,
        name,
        distance_m: Math.round(distance),
        elapsed_time_s: Math.round(elapsed),
        pr_rank: readNumber(record, 'pr_rank'),
      },
    ]
  })
}
