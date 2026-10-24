import { PR_DISTANCES } from '@/config/prDistances'
import { parseDuration } from '@/lib/stats/format'

export const CUSTOM_DISTANCE_VALUE = 'custom'
const METERS_PER_KM = 1000

export type RaceResultInput = {
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
}

export type RaceInputErrors = Partial<Record<string, string>>

export type RaceInputResult = { ok: true; value: RaceResultInput } | { ok: false; errors: RaceInputErrors }

function readText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

function readOptionalText(formData: FormData, name: string): string | null {
  return readText(formData, name) || null
}

function readOptionalPositiveInt(formData: FormData, name: string, errors: RaceInputErrors): number | null {
  const text = readText(formData, name)
  if (!text) return null
  const value = Number(text)
  if (!Number.isInteger(value) || value <= 0) {
    errors[name] = 'Nhập số nguyên dương'
    return null
  }
  return value
}

function readOptionalUrl(formData: FormData, name: string, errors: RaceInputErrors): string | null {
  const text = readText(formData, name)
  if (!text) return null
  if (!/^https?:\/\/\S+$/i.test(text)) {
    errors[name] = 'Link phải bắt đầu bằng http:// hoặc https://'
    return null
  }
  return text
}

function readOptionalDuration(formData: FormData, name: string, errors: RaceInputErrors): number | null {
  const text = readText(formData, name)
  if (!text) return null
  const seconds = parseDuration(text)
  if (seconds === null) errors[name] = 'Nhập theo dạng h:mm:ss hoặc mm:ss'
  return seconds
}

function readDistance(formData: FormData, errors: RaceInputErrors): { label: string; meters: number } | null {
  const choice = readText(formData, 'distance')
  const preset = PR_DISTANCES.find((distance) => distance.name === choice)
  if (preset) return { label: preset.label, meters: preset.distanceMeters }

  const label = readText(formData, 'distance_label')
  const km = Number(readText(formData, 'distance_km').replace(',', '.'))
  if (!label) errors.distance_label = 'Nhập tên cự ly, ví dụ 15K'
  if (!Number.isFinite(km) || km <= 0) errors.distance_km = 'Nhập số km lớn hơn 0'
  if (errors.distance_label || errors.distance_km) return null
  return { label, meters: Math.round(km * METERS_PER_KM) }
}

function readRaceDate(formData: FormData, errors: RaceInputErrors): string {
  const date = readText(formData, 'race_date')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) errors.race_date = 'Chọn ngày chạy'
  return date
}

export function parseRaceResultInput(formData: FormData): RaceInputResult {
  const errors: RaceInputErrors = {}
  const raceName = readText(formData, 'race_name')
  if (!raceName) errors.race_name = 'Nhập tên giải'
  const raceDate = readRaceDate(formData, errors)
  const distance = readDistance(formData, errors)
  const chipTimeSeconds = readOptionalDuration(formData, 'chip_time', errors)
  if (chipTimeSeconds === null && !errors.chip_time) errors.chip_time = 'Nhập thời gian chip'

  const value: RaceResultInput = {
    raceName,
    raceDate,
    city: readOptionalText(formData, 'city'),
    organizer: readOptionalText(formData, 'organizer'),
    url: readOptionalUrl(formData, 'url', errors),
    distanceLabel: distance?.label ?? '',
    distanceMeters: distance?.meters ?? 0,
    chipTimeSeconds: chipTimeSeconds ?? 0,
    gunTimeSeconds: readOptionalDuration(formData, 'gun_time', errors),
    rankOverall: readOptionalPositiveInt(formData, 'rank_overall', errors),
    rankAgeGroup: readOptionalPositiveInt(formData, 'rank_age_group', errors),
    bib: readOptionalText(formData, 'bib'),
    certificateUrl: readOptionalUrl(formData, 'certificate_url', errors),
    activityId: readOptionalPositiveInt(formData, 'activity_id', errors),
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value }
}

export function matchPrDistanceName(distanceLabel: string): string | null {
  const normalized = distanceLabel.trim().toLowerCase()
  return PR_DISTANCES.find((distance) => distance.name === normalized)?.name ?? null
}
