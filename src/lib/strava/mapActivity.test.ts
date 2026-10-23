import { describe, expect, it } from 'vitest'
import manualRun from '@/lib/strava/__fixtures__/manualRun.json'
import outdoorRun from '@/lib/strava/__fixtures__/outdoorRun.json'
import treadmillRun from '@/lib/strava/__fixtures__/treadmillRun.json'
import { mapActivity, mapBestEfforts } from '@/lib/strava/mapActivity'

const MEMBER_ID = 'member-1'

describe('mapActivity', () => {
  it('map hoạt động chạy ngoài trời', () => {
    const row = mapActivity(MEMBER_ID, outdoorRun, { detailFetched: true })
    expect(row).toMatchObject({
      id: 9876543210,
      member_id: MEMBER_ID,
      name: 'Chạy sáng Hồ Tây',
      sport_type: 'Run',
      start_date: '2026-10-20T23:05:12Z',
      distance_m: 10235,
      moving_time_s: 3010,
      elapsed_time_s: 3120,
      elevation_gain_m: 42.3,
      average_heartrate: 151.4,
      max_heartrate: 178,
      average_cadence: 84.2,
      manual: false,
      trainer: false,
      private: false,
      visibility: 'everyone',
      summary_polyline: 'abc123polyline',
      start_latlng: '(21.0545,105.8227)',
      detail_fetched: true,
    })
    expect(row.raw).toEqual(outdoorRun)
  })

  it('map hoạt động chạy máy và riêng tư', () => {
    const row = mapActivity(MEMBER_ID, treadmillRun, { detailFetched: false })
    expect(row).toMatchObject({
      trainer: true,
      private: true,
      visibility: 'only_me',
      summary_polyline: null,
      start_latlng: null,
      average_heartrate: null,
      detail_fetched: false,
    })
  })

  it('map hoạt động nhập tay', () => {
    const row = mapActivity(MEMBER_ID, manualRun, { detailFetched: false })
    expect(row).toMatchObject({ manual: true, visibility: 'only_me', distance_m: 3000, start_latlng: null })
  })

  it('báo lỗi khi thiếu id', () => {
    expect(() => mapActivity(MEMBER_ID, { name: 'x' }, { detailFetched: false })).toThrow()
  })
})

describe('mapBestEfforts', () => {
  it('map danh sách best efforts', () => {
    expect(mapBestEfforts(9876543210, outdoorRun)).toEqual([
      { activity_id: 9876543210, name: '400m', distance_m: 400, elapsed_time_s: 98, pr_rank: null },
      { activity_id: 9876543210, name: '5K', distance_m: 5000, elapsed_time_s: 1450, pr_rank: 2 },
    ])
  })

  it('trả mảng rỗng khi hoạt động không có best efforts', () => {
    expect(mapBestEfforts(1, treadmillRun)).toEqual([])
  })
})
