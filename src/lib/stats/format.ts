const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const rest = seconds % SECONDS_PER_MINUTE
  if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(rest)}`
  return `${pad2(minutes)}:${pad2(rest)}`
}

export function formatPace(distanceMeters: number, timeSeconds: number): string {
  if (distanceMeters <= 0 || timeSeconds <= 0) return '--'
  const secondsPerKm = Math.round(timeSeconds / (distanceMeters / 1000))
  const minutes = Math.floor(secondsPerKm / SECONDS_PER_MINUTE)
  return `${minutes}:${pad2(secondsPerKm % SECONDS_PER_MINUTE)}/km`
}

export function formatKm(distanceMeters: number): string {
  const km = Math.round(distanceMeters / 100) / 10
  return `${km.toFixed(1).replace('.', ',')} km`
}

// Nhận "h:mm:ss", "mm:ss" hoặc "m:ss"; trả null nếu sai định dạng
export function parseDuration(text: string): number | null {
  const parts = text.trim().split(':')
  if (parts.length < 2 || parts.length > 3) return null
  if (!parts.every((part) => /^\d{1,2}$/.test(part))) return null
  const [seconds = 0, minutes = 0, hours = 0] = parts.map(Number).reverse()
  if (seconds >= SECONDS_PER_MINUTE) return null
  if (parts.length === 3 && minutes >= SECONDS_PER_MINUTE) return null
  const total = hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds
  return total > 0 ? total : null
}
