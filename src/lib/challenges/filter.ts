import type { ActivityFilter } from '@/lib/challenges/types'

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function hourValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 24 ? value : undefined
}

// Đọc jsonb từ DB thành bộ lọc có kiểu; trường sai kiểu bị bỏ qua
export function parseActivityFilter(raw: unknown): ActivityFilter {
  if (typeof raw !== 'object' || raw === null) return {}
  const source = raw as Record<string, unknown>
  const filter: ActivityFilter = {}

  const minDistance = positiveNumber(source.min_distance_m)
  if (minDistance !== undefined) filter.min_distance_m = minDistance
  const maxPace = positiveNumber(source.max_pace_s_per_km)
  if (maxPace !== undefined) filter.max_pace_s_per_km = maxPace
  const minPace = positiveNumber(source.min_pace_s_per_km)
  if (minPace !== undefined) filter.min_pace_s_per_km = minPace
  const dailyCap = positiveNumber(source.max_distance_per_day_m)
  if (dailyCap !== undefined) filter.max_distance_per_day_m = dailyCap

  if (Array.isArray(source.sport_types)) {
    const sports = source.sport_types.filter((item): item is string => typeof item === 'string')
    if (sports.length > 0) filter.sport_types = sports
  }

  const window = source.time_window
  if (typeof window === 'object' && window !== null) {
    const start = hourValue((window as Record<string, unknown>).start_hour)
    const end = hourValue((window as Record<string, unknown>).end_hour)
    if (start !== undefined && end !== undefined && start !== end)
      filter.time_window = { start_hour: start, end_hour: end }
  }
  return filter
}

function formatPace(secondsPerKm: number): string {
  return `${Math.floor(secondsPerKm / 60)}:${String(Math.round(secondsPerKm % 60)).padStart(2, '0')}/km`
}

// Mô tả luật mỗi buổi bằng tiếng Việt, sinh từ cấu hình
export function describeActivityFilter(filter: ActivityFilter): string[] {
  const lines: string[] = []
  if (filter.min_distance_m !== undefined) lines.push(`Mỗi buổi dài từ ${filter.min_distance_m / 1000} km`)
  if (filter.max_pace_s_per_km !== undefined) lines.push(`Pace nhanh hơn ${formatPace(filter.max_pace_s_per_km)}`)
  if (filter.min_pace_s_per_km !== undefined) lines.push(`Pace không nhanh hơn ${formatPace(filter.min_pace_s_per_km)}`)
  if (filter.max_distance_per_day_m !== undefined) {
    lines.push(`Tối đa ${filter.max_distance_per_day_m / 1000} km mỗi ngày`)
  }
  if (filter.time_window) {
    lines.push(`Chỉ tính buổi bắt đầu từ ${filter.time_window.start_hour}:00 đến ${filter.time_window.end_hour}:00`)
  }
  if (filter.sport_types) lines.push(`Môn được tính: ${filter.sport_types.join(', ')}`)
  return lines
}
