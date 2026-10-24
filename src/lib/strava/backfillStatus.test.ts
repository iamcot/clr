import { describe, expect, it } from 'vitest'
import { describeBackfillStatus } from '@/lib/strava/backfillStatus'

describe('describeBackfillStatus', () => {
  it('đang kéo: hiện số hoạt động và mốc tháng', () => {
    expect(
      describeBackfillStatus({ status: 'pending', activityCount: 312, cursorBefore: '2025-03-15T05:00:00Z' }),
    ).toContain('Đang đồng bộ lịch sử: đã có 312 hoạt động, đến 03/2025')
  })

  it('chưa bắt đầu', () => {
    expect(describeBackfillStatus({ status: 'pending', activityCount: 0, cursorBefore: null })).toContain(
      'Đang chờ đồng bộ lịch sử hoạt động',
    )
  })

  it('đang kéo: nhắc người dùng có thể phải chờ', () => {
    expect(describeBackfillStatus({ status: 'pending', activityCount: 0, cursorBefore: null })).toContain('vài phút')
  })

  it('đã xong: không hiện gì', () => {
    expect(describeBackfillStatus({ status: 'done', activityCount: 400, cursorBefore: null })).toBeNull()
  })

  it('thất bại: nhắc kết nối lại', () => {
    expect(describeBackfillStatus({ status: 'failed', activityCount: 5, cursorBefore: null })).toContain('kết nối lại')
  })
})
