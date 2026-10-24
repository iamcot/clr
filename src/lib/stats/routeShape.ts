export type LatLng = { lat: number; lng: number }

const POLYLINE_PRECISION = 1e5

// Giải mã Google encoded polyline (định dạng `summary_polyline` của Strava)
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  function readDelta(): number {
    let result = 0
    let shift = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20 && index < encoded.length)
    return result & 1 ? ~(result >> 1) : result >> 1
  }

  while (index < encoded.length) {
    lat += readDelta()
    lng += readDelta()
    points.push({ lat: lat / POLYLINE_PRECISION, lng: lng / POLYLINE_PRECISION })
  }
  return points
}

// Chiếu các điểm vào khung vuông `size` giữ đúng tỉ lệ, trả chuỗi `d` cho thẻ <path>
export function polylineToSvgPath(points: LatLng[], size: number, padding: number): string {
  if (points.length < 2) return ''
  const lats = points.map((point) => point.lat)
  const lngs = points.map((point) => point.lng)
  const minLat = Math.min(...lats)
  const minLng = Math.min(...lngs)
  const midLat = (minLat + Math.max(...lats)) / 2
  const lngScale = Math.cos((midLat * Math.PI) / 180)
  const width = (Math.max(...lngs) - minLng) * lngScale
  const height = Math.max(...lats) - minLat
  const span = Math.max(width, height)
  if (span === 0) return ''

  const scale = (size - padding * 2) / span
  const offsetX = (size - width * scale) / 2
  const offsetY = (size - height * scale) / 2
  return points
    .map((point, index) => {
      const x = offsetX + (point.lng - minLng) * lngScale * scale
      const y = size - (offsetY + (point.lat - minLat) * scale)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}
