import type { EventView } from '@/lib/events/loadEvents'
import { toVietnamInputValue } from '@/lib/format/dateTime'

const METERS_PER_KM = 1000

export function eventFormDefaults(event: EventView): Record<string, string> {
  return {
    id: event.id,
    title: event.title,
    kind: event.kind,
    status: event.status,
    starts_at: toVietnamInputValue(event.startsAt),
    ends_at: toVietnamInputValue(event.endsAt),
    registration_closes_at: event.registrationClosesAt ? toVietnamInputValue(event.registrationClosesAt) : '',
    location_name: event.locationName,
    location_lat: event.locationLat === null ? '' : String(event.locationLat),
    location_lng: event.locationLng === null ? '' : String(event.locationLng),
    capacity: event.capacity === null ? '' : String(event.capacity),
    fee: event.fee === null ? '' : String(event.fee),
    route_distance_km: event.routeDistanceM === null ? '' : String(event.routeDistanceM / METERS_PER_KM),
    description_md: event.descriptionMd,
    cover_url: event.coverUrl ?? '',
    absent_penalty: event.absentPenalty ? 'on' : '',
  }
}
