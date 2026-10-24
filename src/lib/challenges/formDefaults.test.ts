import { describe, expect, it } from 'vitest'
import { parseChallengeInput } from '@/lib/challenges/challengeInput'
import { toFormDefaults } from '@/lib/challenges/formDefaults'

describe('toFormDefaults', () => {
  it('điền form rồi đọc lại cho ra đúng cấu hình ban đầu', () => {
    const defaults = toFormDefaults({
      id: 'abc',
      title: 'Tháng 11',
      description: 'Mô tả',
      coverUrl: null,
      startsAt: '2026-10-31T17:00:00.000Z',
      endsAt: '2026-11-30T16:59:00.000Z',
      goalType: 'total_distance',
      participation: 'mandatory_official',
      registrationClosesAt: null,
      ranking: 'value_desc',
      filter: {
        min_distance_m: 2000,
        max_pace_s_per_km: 540,
        max_distance_per_day_m: 21000,
        time_window: { start_hour: 4, end_hour: 9 },
      },
      penaltyRule: {
        penalties: [{ when: 'not_completed', type: 'challenge_fail', amount: 100000 }],
        exempt_member_types: ['free'],
      },
      rewardRule: { rewards: [] },
      categories: [
        {
          id: 'c1',
          name: 'Nam',
          goalValue: 100000,
          gender: 'M',
          memberType: null,
        },
      ],
    })
    const formData = new FormData()
    for (const [key, value] of Object.entries(defaults)) formData.set(key, value)
    const result = parseChallengeInput(formData)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.categories[0]).toEqual({
      id: 'c1',
      name: 'Nam',
      goalValue: 100000,
      gender: 'M',
      memberType: null,
    })
    expect(result.value.activityFilter).toEqual({
      min_distance_m: 2000,
      max_pace_s_per_km: 540,
      max_distance_per_day_m: 21000,
      time_window: { start_hour: 4, end_hour: 9 },
    })
    expect(result.value.endsAt).toBe('2026-11-30T16:59:00.000Z')
  })
})
