import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_KINDS,
  EVENT_TITLE_MAX_LENGTH,
} from '@/config/events'
import { fromVietnamInputValue } from '@/lib/format/dateTime'
import type { EventKind, EventStatus } from '@/lib/types/database'

const METERS_PER_KM = 1000
const EDITABLE_STATUSES: readonly EventStatus[] = ['draft', 'published', 'cancelled', 'done']

export type EventInput = {
  title: string
  kind: EventKind
  descriptionMd: string
  coverUrl: string | null
  locationName: string
  locationLat: number | null
  locationLng: number | null
  startsAt: string
  endsAt: string
  registrationClosesAt: string | null
  capacity: number | null
  fee: number | null
  routeDistanceM: number | null
  status: EventStatus
  absentPenalty: boolean
}

export type EventInputResult = { ok: true; value: EventInput } | { ok: false; errors: Record<string, string> }

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function parseNumber(raw: string): number | null {
  if (raw === '') return null
  const value = Number(raw.replace(',', '.'))
  return Number.isFinite(value) ? value : Number.NaN
}

function parseDate(formData: FormData, key: string): string | null {
  const raw = text(formData, key)
  return raw === '' ? null : fromVietnamInputValue(raw)
}

function parsePositiveInt(raw: string, label: string, errors: Record<string, string>, key: string): number | null {
  const value = parseNumber(raw)
  if (value === null) return null
  if (Number.isNaN(value) || !Number.isInteger(value) || value <= 0) errors[key] = `${label} phải là số nguyên dương`
  return Number.isNaN(value) ? null : value
}

function parseCoordinates(formData: FormData, errors: Record<string, string>): { lat: number | null; lng: number | null } {
  const lat = parseNumber(text(formData, 'location_lat'))
  const lng = parseNumber(text(formData, 'location_lng'))
  if (lat === null && lng === null) return { lat: null, lng: null }
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
    errors.location_lat = 'Nhập đủ cả vĩ độ và kinh độ (số)'
    return { lat: null, lng: null }
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) errors.location_lat = 'Toạ độ nằm ngoài phạm vi hợp lệ'
  return { lat, lng }
}

export function parseEventInput(formData: FormData): EventInputResult {
  const errors: Record<string, string> = {}
  const title = text(formData, 'title')
  const descriptionMd = String(formData.get('description_md') ?? '').trim()
  const kind = EVENT_KINDS.find((item) => item === text(formData, 'kind'))
  const status = EDITABLE_STATUSES.find((item) => item === text(formData, 'status'))
  const coverUrl = text(formData, 'cover_url')
  const startsAt = parseDate(formData, 'starts_at')
  const endsAt = parseDate(formData, 'ends_at')
  const registrationClosesAt = parseDate(formData, 'registration_closes_at')

  if (title === '') errors.title = 'Nhập tên event'
  if (title.length > EVENT_TITLE_MAX_LENGTH) errors.title = `Tên tối đa ${EVENT_TITLE_MAX_LENGTH} ký tự`
  if (descriptionMd.length > EVENT_DESCRIPTION_MAX_LENGTH) {
    errors.description_md = `Mô tả tối đa ${EVENT_DESCRIPTION_MAX_LENGTH} ký tự`
  }
  if (!kind) errors.kind = 'Chọn loại event'
  if (!status) errors.status = 'Chọn trạng thái'
  if (coverUrl !== '' && !isHttpsUrl(coverUrl)) errors.cover_url = 'Link ảnh bìa phải bắt đầu bằng https://'
  if (!startsAt) errors.starts_at = 'Chọn giờ bắt đầu'
  if (!endsAt) errors.ends_at = 'Chọn giờ kết thúc'
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) errors.ends_at = 'Giờ kết thúc phải sau giờ bắt đầu'
  if (text(formData, 'registration_closes_at') !== '' && !registrationClosesAt) {
    errors.registration_closes_at = 'Hạn đăng ký không hợp lệ'
  }

  const capacity = parsePositiveInt(text(formData, 'capacity'), 'Số chỗ', errors, 'capacity')
  const routeKm = parseNumber(text(formData, 'route_distance_km'))
  if (routeKm !== null && (Number.isNaN(routeKm) || routeKm <= 0)) errors.route_distance_km = 'Cự ly phải là số dương'
  const fee = parseNumber(text(formData, 'fee'))
  if (fee !== null && (Number.isNaN(fee) || !Number.isInteger(fee) || fee < 0)) errors.fee = 'Phí phải là số nguyên không âm'
  const { lat, lng } = parseCoordinates(formData, errors)

  if (Object.keys(errors).length > 0 || !kind || !status || !startsAt || !endsAt) return { ok: false, errors }
  return {
    ok: true,
    value: {
      title,
      kind,
      descriptionMd,
      coverUrl: coverUrl === '' ? null : coverUrl,
      locationName: text(formData, 'location_name'),
      locationLat: lat,
      locationLng: lng,
      startsAt,
      endsAt,
      registrationClosesAt,
      capacity,
      fee,
      routeDistanceM: routeKm === null || Number.isNaN(routeKm) ? null : Math.round(routeKm * METERS_PER_KM),
      status,
      absentPenalty: formData.get('absent_penalty') === 'on',
    },
  }
}
