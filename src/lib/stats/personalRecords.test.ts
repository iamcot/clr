import { describe, expect, it } from 'vitest'
import { mergePersonalRecords } from '@/lib/stats/personalRecords'

const stravaPrs = [
  { distanceName: '5k', timeSeconds: 1500, activityId: 1, date: '2026-01-01T00:00:00Z' },
  { distanceName: '10k', timeSeconds: 3200, activityId: 2, date: '2026-02-01T00:00:00Z' },
]

describe('mergePersonalRecords', () => {
  it('ưu tiên override hơn PR Strava', () => {
    const records = mergePersonalRecords(stravaPrs, [{ distanceName: '10k', timeSeconds: 3100, source: 'race' }])
    const tenK = records.find((record) => record.distanceName === '10k')
    expect(tenK).toMatchObject({ timeSeconds: 3100, source: 'race', activityId: null })
  })

  it('giữ thứ tự cự ly và bỏ cự ly không có dữ liệu', () => {
    const records = mergePersonalRecords(stravaPrs, [])
    expect(records.map((record) => record.label)).toEqual(['5K', '10K'])
  })

  it('PR chỉ có override vẫn hiện', () => {
    const records = mergePersonalRecords([], [{ distanceName: 'marathon', timeSeconds: 12000, source: 'manual' }])
    expect(records).toHaveLength(1)
  })
})
