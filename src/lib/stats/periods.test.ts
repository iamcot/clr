import { describe, expect, it } from 'vitest'
import {
  addMonths,
  lastMonthStarts,
  lastWeekStarts,
  longestStreak,
  monthStartVN,
  percentChange,
  weekStartVN,
} from '@/lib/stats/periods'

describe('weekStartVN', () => {
  it('23:30 Chủ nhật giờ VN vẫn thuộc tuần đó', () => {
    // Chủ nhật 2026-10-25 23:30 +07 = 16:30 UTC cùng ngày
    expect(weekStartVN(new Date('2026-10-25T16:30:00Z'))).toBe('2026-10-19')
  })

  it('00:30 thứ Hai giờ VN sang tuần mới dù UTC vẫn là Chủ nhật', () => {
    expect(weekStartVN(new Date('2026-10-25T17:30:00Z'))).toBe('2026-10-26')
  })

  it('thứ Hai trả về chính nó', () => {
    expect(weekStartVN(new Date('2026-10-19T03:00:00Z'))).toBe('2026-10-19')
  })
})

describe('monthStartVN', () => {
  it('tính theo giờ VN: 00:10 ngày 1 giờ VN thuộc tháng mới', () => {
    expect(monthStartVN(new Date('2026-10-31T17:10:00Z'))).toBe('2026-11-01')
  })
})

describe('lastWeekStarts', () => {
  it('trả đủ số tuần, cũ nhất trước', () => {
    const weeks = lastWeekStarts(new Date('2026-10-24T03:00:00Z'), 3)
    expect(weeks).toEqual(['2026-10-05', '2026-10-12', '2026-10-19'])
  })
})

describe('addMonths / lastMonthStarts', () => {
  it('qua năm', () => {
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01')
    expect(addMonths('2026-11-01', 3)).toBe('2027-02-01')
  })

  it('12 tháng kết thúc ở tháng hiện tại', () => {
    const months = lastMonthStarts(new Date('2026-10-24T03:00:00Z'), 12)
    expect(months[0]).toBe('2025-11-01')
    expect(months[11]).toBe('2026-10-01')
  })
})

describe('percentChange', () => {
  it('tính phần trăm so với kỳ trước', () => {
    expect(percentChange(112, 100)).toBe(12)
    expect(percentChange(50, 100)).toBe(-50)
  })

  it('kỳ trước bằng 0 thì không so được', () => {
    expect(percentChange(10, 0)).toBeNull()
  })
})

describe('longestStreak', () => {
  it('tìm chuỗi ngày liên tiếp dài nhất, bỏ ngày trùng', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11']
    expect(longestStreak(dates)).toBe(3)
  })

  it('danh sách rỗng là 0', () => {
    expect(longestStreak([])).toBe(0)
  })
})
