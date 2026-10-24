import { describe, expect, it } from 'vitest'
import { describeActivityFilter, parseActivityFilter } from '@/lib/challenges/filter'

describe('parseActivityFilter', () => {
  it('bỏ qua trường sai kiểu', () => {
    const filter = parseActivityFilter({
      min_distance_m: '2000',
      max_pace_s_per_km: 540,
      sport_types: ['Run', 3],
    })
    expect(filter).toEqual({ max_pace_s_per_km: 540, sport_types: ['Run'] })
  })

  it('đọc khung giờ hợp lệ, bỏ khung giờ trùng đầu cuối', () => {
    expect(parseActivityFilter({ time_window: { start_hour: 4, end_hour: 9 } }).time_window).toEqual({
      start_hour: 4,
      end_hour: 9,
    })
    expect(parseActivityFilter({ time_window: { start_hour: 4, end_hour: 4 } }).time_window).toBeUndefined()
  })

  it('không phải object thì rỗng', () => {
    expect(parseActivityFilter(null)).toEqual({})
    expect(parseActivityFilter('x')).toEqual({})
  })
})

describe('describeActivityFilter', () => {
  it('sinh mô tả dễ đọc', () => {
    const lines = describeActivityFilter({
      min_distance_m: 2000,
      max_pace_s_per_km: 540,
      max_distance_per_day_m: 21000,
    })
    expect(lines).toEqual(['Mỗi buổi dài từ 2 km', 'Pace nhanh hơn 9:00/km', 'Tối đa 21 km mỗi ngày'])
  })
})
