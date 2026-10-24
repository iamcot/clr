import { describe, expect, it } from 'vitest'
import { formatDateTile, formatEventSchedule, formatEventStart } from '@/lib/events/eventFormat'

const STARTS_AT = '2025-10-25T22:15:00Z' // 05:15 Chủ nhật 26/10 giờ Việt Nam
const ENDS_AT = '2025-10-26T00:00:00Z'

describe('eventFormat', () => {
  it('ô lịch theo giờ Việt Nam', () => {
    expect(formatDateTile(STARTS_AT)).toEqual({ weekday: 'CN', day: '26', month: 'Th10' })
  })

  it('lịch trình đủ ngày và giờ', () => {
    expect(formatEventSchedule(STARTS_AT, ENDS_AT)).toBe('Chủ nhật, 26/10 · 5:15 - 7:00')
  })

  it('giờ bắt đầu kèm địa điểm nếu có', () => {
    expect(formatEventStart(STARTS_AT, 'Cổng chính Celadon City')).toBe('5:15 · Cổng chính Celadon City')
    expect(formatEventStart(STARTS_AT, '')).toBe('5:15')
  })
})
