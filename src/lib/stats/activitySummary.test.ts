import { describe, expect, it } from 'vitest'
import { summarizeMonthAndYear } from '@/lib/stats/activitySummary'

describe('summarizeMonthAndYear', () => {
  it('cộng riêng theo tháng và năm', () => {
    const activities = [
      { startDateLocal: '2026-10-02T05:00:00', distanceMeters: 5000, movingTimeSeconds: 1500 },
      { startDateLocal: '2026-10-20T05:00:00', distanceMeters: 10000, movingTimeSeconds: 3000 },
      { startDateLocal: '2026-03-01T05:00:00', distanceMeters: 8000, movingTimeSeconds: 2400 },
      { startDateLocal: '2025-10-05T05:00:00', distanceMeters: 7000, movingTimeSeconds: 2100 },
    ]
    const summary = summarizeMonthAndYear(activities, '2026-10-24T09:00:00')
    expect(summary.month).toEqual({ distanceMeters: 15000, sessions: 2, movingTimeSeconds: 4500 })
    expect(summary.year).toEqual({ distanceMeters: 23000, sessions: 3, movingTimeSeconds: 6900 })
  })
})
