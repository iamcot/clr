import { decodePolyline, polylineToSvgPath } from '@/lib/stats/routeShape'

const MAP_SIZE = 96
const MAP_PADDING = 6

export default function RouteMap({ polyline }: { polyline: string | null }) {
  if (!polyline) return null
  const path = polylineToSvgPath(decodePolyline(polyline), MAP_SIZE, MAP_PADDING)
  if (!path) return null

  return (
    <svg
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      className="size-16 shrink-0 rounded-lg bg-page"
      role="img"
      aria-label="Đường chạy"
    >
      <path d={path} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
