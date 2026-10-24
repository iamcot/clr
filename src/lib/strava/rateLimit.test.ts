import { describe, expect, it } from 'vitest'
import {
  canSpend,
  nextWindowReset,
  parseRateHeaders,
  retryTimeAfterRateLimit,
  type RateSnapshot,
} from '@/lib/strava/rateLimit'

const NOW = new Date('2026-10-23T10:07:00Z')

function headersOf(values: Record<string, string>) {
  return new Headers(values)
}

describe('parseRateHeaders', () => {
  it('đọc cả hạn mức chung và hạn mức đọc', () => {
    const snapshot = parseRateHeaders(
      headersOf({
        'X-RateLimit-Limit': '200,2000',
        'X-RateLimit-Usage': '12,345',
        'X-ReadRateLimit-Limit': '100,1000',
        'X-ReadRateLimit-Usage': '9,210',
      }),
      NOW,
    )
    expect(snapshot.all_15m).toEqual({ limit: 200, usage: 12, updatedAt: NOW })
    expect(snapshot.all_day).toEqual({ limit: 2000, usage: 345, updatedAt: NOW })
    expect(snapshot.read_15m).toEqual({ limit: 100, usage: 9, updatedAt: NOW })
    expect(snapshot.read_day).toEqual({ limit: 1000, usage: 210, updatedAt: NOW })
  })

  it('bỏ qua khi không có header', () => {
    expect(parseRateHeaders(headersOf({}), NOW)).toEqual({})
  })
})

describe('canSpend', () => {
  const nearLimit: RateSnapshot = { read_15m: { limit: 100, usage: 85, updatedAt: NOW } }

  it('việc nền dừng khi vượt ngưỡng nhưng webhook vẫn được dùng', () => {
    expect(canSpend(nearLimit, 'background', NOW)).toBe(false)
    expect(canSpend(nearLimit, 'webhook', NOW)).toBe(true)
  })

  it('webhook dừng khi đã cạn hạn mức', () => {
    const exhausted: RateSnapshot = { read_15m: { limit: 100, usage: 100, updatedAt: NOW } }
    expect(canSpend(exhausted, 'webhook', NOW)).toBe(false)
  })

  it('cửa sổ đã reset thì coi như chưa dùng', () => {
    const later = new Date('2026-10-23T10:20:00Z')
    expect(canSpend(nearLimit, 'background', later)).toBe(true)
  })

  it('chưa có số đo thì cho phép', () => {
    expect(canSpend({}, 'background', NOW)).toBe(true)
  })

  it('việc nền dừng khi hạn mức ngày dùng quá ngưỡng', () => {
    const busyDay: RateSnapshot = { read_day: { limit: 1000, usage: 720, updatedAt: NOW } }
    expect(canSpend(busyDay, 'background', NOW)).toBe(false)
    expect(canSpend(busyDay, 'webhook', NOW)).toBe(true)
  })
})

describe('nextWindowReset', () => {
  it('cửa sổ 15 phút kết thúc ở mốc tròn kế tiếp', () => {
    expect(nextWindowReset('read_15m', NOW).toISOString()).toBe('2026-10-23T10:15:00.000Z')
  })

  it('cửa sổ ngày kết thúc lúc nửa đêm UTC', () => {
    expect(nextWindowReset('read_day', NOW).toISOString()).toBe('2026-10-24T00:00:00.000Z')
  })
})

describe('retryTimeAfterRateLimit', () => {
  it('chờ cửa sổ 15 phút khi chỉ cạn hạn mức ngắn', () => {
    expect(retryTimeAfterRateLimit({}, NOW).toISOString()).toBe('2026-10-23T10:15:00.000Z')
  })

  it('chờ tới ngày mai khi cạn hạn mức ngày', () => {
    const snapshot: RateSnapshot = { read_day: { limit: 1000, usage: 1000, updatedAt: NOW } }
    expect(retryTimeAfterRateLimit(snapshot, NOW).toISOString()).toBe('2026-10-24T00:00:00.000Z')
  })
})
