import { describe, expect, it } from 'vitest'
import { parseChallengeInput, parsePaceText } from '@/lib/challenges/challengeInput'

function formOf(values: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

const VALID = {
  title: 'Tháng 11 - 100K',
  starts_at: '2026-11-01T00:00',
  ends_at: '2026-11-30T23:59',
  goal_type: 'total_distance',
  cat_0_name: 'Nam',
  cat_0_goal: '100',
  cat_0_gender: 'M',
  cat_1_name: 'Nữ',
  cat_1_goal: '80',
  cat_1_gender: 'F',
  min_distance_km: '2',
  max_pace: '9:00',
  max_km_per_day: '21',
  fail_amount: '100000',
  low_amount: '200000',
  low_threshold_pct: '50',
  exempt_free: 'on',
}

describe('parseChallengeInput', () => {
  it('đổi km sang mét và giờ VN sang UTC', () => {
    const result = parseChallengeInput(formOf(VALID))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.startsAt).toBe('2026-10-31T17:00:00.000Z')
    expect(result.value.categories.map((category) => category.goalValue)).toEqual([100_000, 80_000])
    expect(result.value.activityFilter).toEqual({
      min_distance_m: 2000,
      max_pace_s_per_km: 540,
      max_distance_per_day_m: 21_000,
    })
    expect(result.value.penaltyRule.penalties).toHaveLength(2)
  })

  it('mục tiêu số ngày giữ nguyên đơn vị', () => {
    const result = parseChallengeInput(
      formOf({
        ...VALID,
        goal_type: 'active_days',
        cat_0_goal: '20',
        cat_1_name: '',
      }),
    )
    expect(result.ok && result.value.categories[0]?.goalValue).toBe(20)
  })

  it('báo lỗi thiếu hạng mục và ngày sai thứ tự', () => {
    const result = parseChallengeInput(
      formOf({
        ...VALID,
        cat_0_name: '',
        cat_1_name: '',
        ends_at: '2026-10-01T00:00',
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.cat_0_name).toBeDefined()
    expect(result.errors.ends_at).toBeDefined()
  })

  it('pace sai định dạng báo lỗi', () => {
    const result = parseChallengeInput(formOf({ ...VALID, max_pace: '9.00' }))
    expect(result.ok).toBe(false)
  })
})

describe('parsePaceText', () => {
  it('đọc m:ss', () => {
    expect(parsePaceText('5:30')).toBe(330)
    expect(parsePaceText('5:75')).toBeNull()
  })
})
