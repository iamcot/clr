type MapPoint = { lat: number | null; lng: number | null; name: string }

export function googleMapsUrl({ lat, lng, name }: MapPoint): string | null {
  const query = lat !== null && lng !== null ? `${lat},${lng}` : name.trim()
  if (query === '') return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
