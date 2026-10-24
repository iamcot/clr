const EARTH_RADIUS_M = 6_371_000

export type GeoPoint = { lat: number; lng: number }

export type MatchableEvent = { startsAt: string; endsAt: string; point: GeoPoint | null }

export type MatchableActivity = {
  activityId: number
  memberId: string
  startDate: string
  distanceMeters: number
  startPoint: string | null
  isPrivate: boolean
  privateCountsInTotals: boolean
}

export type MatchRules = { windowMs: number; radiusMeters: number }

// PostgREST trả kiểu point dạng '(vĩ độ,kinh độ)'
export function parsePoint(text: string | null): GeoPoint | null {
  const match = text?.match(/^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/)
  if (!match) return null
  return { lat: Number(match[1]), lng: Number(match[2]) }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(deltaLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(haversine))
}

function isCandidate(event: MatchableEvent, activity: MatchableActivity, rules: MatchRules): boolean {
  if (!event.point) return false
  if (activity.isPrivate && !activity.privateCountsInTotals) return false
  const start = Date.parse(activity.startDate)
  if (start < Date.parse(event.startsAt) - rules.windowMs || start > Date.parse(event.endsAt) + rules.windowMs) return false
  const startPoint = parsePoint(activity.startPoint)
  return startPoint !== null && distanceMeters(event.point, startPoint) <= rules.radiusMeters
}

// Mỗi thành viên một hoạt động: buổi dài nhất trong số các buổi khớp giờ và địa điểm. Event không có toạ độ thì không tự gắn
export function matchEventActivities(
  event: MatchableEvent,
  activities: MatchableActivity[],
  rules: MatchRules,
): Map<string, number> {
  const best = new Map<string, MatchableActivity>()
  for (const activity of activities) {
    if (!isCandidate(event, activity, rules)) continue
    const current = best.get(activity.memberId)
    if (!current || activity.distanceMeters > current.distanceMeters) best.set(activity.memberId, activity)
  }
  return new Map([...best].map(([memberId, activity]) => [memberId, activity.activityId]))
}
