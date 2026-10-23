import { describe, expect, it } from 'vitest'
import { passesActivityRules } from '@/lib/strava/validity'

const validRun = { sport_type: 'Run', manual: false, distance_m: 5000, moving_time_s: 1500 }

describe('passesActivityRules', () => {
  it('tính chạy ngoài trời bình thường', () => {
    expect(passesActivityRules(validRun)).toBe(true)
  })

  it('tính chạy máy (VirtualRun)', () => {
    expect(passesActivityRules({ ...validRun, sport_type: 'VirtualRun' })).toBe(true)
  })

  it('không tính đạp xe', () => {
    expect(passesActivityRules({ ...validRun, sport_type: 'Ride' })).toBe(false)
  })

  it('không tính hoạt động nhập tay', () => {
    expect(passesActivityRules({ ...validRun, manual: true })).toBe(false)
  })

  it('không tính pace nhanh bất thường (2:30/km)', () => {
    expect(passesActivityRules({ ...validRun, moving_time_s: 750 })).toBe(false)
  })

  it('tính pace đúng bằng ngưỡng (2:50/km)', () => {
    expect(passesActivityRules({ ...validRun, moving_time_s: 850 })).toBe(true)
  })

  it('không tính hoạt động không có quãng đường', () => {
    expect(passesActivityRules({ ...validRun, distance_m: 0 })).toBe(false)
  })

  it('cho phép đổi luật qua tham số', () => {
    const rules = { allowedSportTypes: ['Walk'], allowManual: true, fastestPaceSecondsPerKm: 0 }
    expect(passesActivityRules({ ...validRun, sport_type: 'Walk', manual: true }, rules)).toBe(true)
  })
})
