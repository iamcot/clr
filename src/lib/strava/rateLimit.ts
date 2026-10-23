import { DEFAULT_RATE_LIMITS, SPEND_THRESHOLDS } from '@/config/strava'

export type RateWindowName = keyof typeof DEFAULT_RATE_LIMITS
export type RateWindow = { limit: number; usage: number; updatedAt: Date }
export type RateSnapshot = Partial<Record<RateWindowName, RateWindow>>
export type SpendPurpose = keyof typeof SPEND_THRESHOLDS

const WINDOW_NAMES = Object.keys(DEFAULT_RATE_LIMITS) as RateWindowName[]
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000

function windowLengthMs(name: RateWindowName): number {
  return name.endsWith('_day') ? ONE_DAY_MS : FIFTEEN_MINUTES_MS
}

// Cả hai cửa sổ của Strava căn theo UTC: mỗi 15 phút tròn và nửa đêm UTC
export function windowStart(name: RateWindowName, now: Date): Date {
  const length = windowLengthMs(name)
  return new Date(Math.floor(now.getTime() / length) * length)
}

export function nextWindowReset(name: RateWindowName, now: Date): Date {
  return new Date(windowStart(name, now).getTime() + windowLengthMs(name))
}

function parsePair(value: string | null): [number, number] | null {
  if (!value) return null
  const [short, day] = value.split(',').map((part) => Number(part.trim()))
  if (short === undefined || day === undefined || Number.isNaN(short) || Number.isNaN(day)) return null
  return [short, day]
}

export function parseRateHeaders(headers: Headers, now: Date): RateSnapshot {
  const snapshot: RateSnapshot = {}
  const readers = [
    { limit: 'x-ratelimit-limit', usage: 'x-ratelimit-usage', short: 'all_15m', day: 'all_day' },
    { limit: 'x-readratelimit-limit', usage: 'x-readratelimit-usage', short: 'read_15m', day: 'read_day' },
  ] as const

  for (const reader of readers) {
    const limits = parsePair(headers.get(reader.limit))
    const usages = parsePair(headers.get(reader.usage))
    if (!limits || !usages) continue
    snapshot[reader.short] = { limit: limits[0], usage: usages[0], updatedAt: now }
    snapshot[reader.day] = { limit: limits[1], usage: usages[1], updatedAt: now }
  }
  return snapshot
}

// Số đo cũ hơn đầu cửa sổ hiện tại thì cửa sổ đã reset
export function currentUsage(name: RateWindowName, window: RateWindow | undefined, now: Date): number {
  if (!window || window.updatedAt < windowStart(name, now)) return 0
  return window.usage
}

export function canSpend(snapshot: RateSnapshot, purpose: SpendPurpose, now: Date): boolean {
  const thresholds = SPEND_THRESHOLDS[purpose]
  return WINDOW_NAMES.every((name) => {
    const window = snapshot[name]
    const limit = window?.limit ?? DEFAULT_RATE_LIMITS[name]
    const ratio = name.endsWith('_day') ? thresholds.day : thresholds.shortWindow
    return currentUsage(name, window, now) < limit * ratio
  })
}

// Cửa sổ ngày đã cạn thì phải chờ tới nửa đêm UTC, ngược lại chờ cửa sổ 15 phút kế tiếp
export function retryTimeAfterRateLimit(snapshot: RateSnapshot, now: Date): Date {
  const dayExhausted = (['read_day', 'all_day'] as const).some((name) => {
    const window = snapshot[name]
    return window !== undefined && currentUsage(name, window, now) >= window.limit
  })
  return nextWindowReset(dayExhausted ? 'read_day' : 'read_15m', now)
}

export function mergeSnapshots(previous: RateSnapshot, update: RateSnapshot): RateSnapshot {
  return { ...previous, ...update }
}
