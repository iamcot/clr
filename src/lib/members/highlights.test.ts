import { describe, expect, it } from 'vitest'
import {
  describeHonor,
  describePr,
  describeRace,
  isWithinDays,
  mergeHighlights,
  type HighlightItem,
} from '@/lib/members/highlights'

function item(id: string, date: string): HighlightItem {
  return { id, memberId: 'm', memberName: 'An', kind: 'pr', text: id, date }
}

describe('isWithinDays', () => {
  const now = new Date('2026-10-30T00:00:00Z')

  it('nhận ngày trong khoảng và loại ngày cũ hoặc ở tương lai', () => {
    expect(isWithinDays('2026-10-20T00:00:00Z', 30, now)).toBe(true)
    expect(isWithinDays('2026-08-01T00:00:00Z', 30, now)).toBe(false)
    expect(isWithinDays('2026-11-05T00:00:00Z', 30, now)).toBe(false)
  })
})

describe('describe*', () => {
  it('PR dùng nhãn cự ly và thời gian', () => {
    expect(describePr('5k', 1500)).toBe('đạt PR 5K: 25:00')
  })

  it('danh hiệu có ngoặc kép', () => {
    expect(describeHonor('Hạng 2 lứa tuổi 10K')).toBe('nhận danh hiệu “Hạng 2 lứa tuổi 10K”')
  })

  it('giải có podium thì nêu hạng, không thì chỉ nói hoàn thành', () => {
    expect(describeRace('10K', 'Giải A', 2, null)).toBe('đạt hạng 2 toàn giải 10K tại Giải A')
    expect(describeRace('10K', 'Giải A', 40, 3)).toBe('đạt hạng 3 lứa tuổi 10K tại Giải A')
    expect(describeRace('10K', 'Giải A', 40, 9)).toBe('vừa hoàn thành 10K tại Giải A')
  })
})

describe('mergeHighlights', () => {
  it('xếp mới nhất trước và cắt theo giới hạn', () => {
    const merged = mergeHighlights([item('a', '2026-10-01'), item('b', '2026-10-20'), item('c', '2026-10-10')], 2)
    expect(merged.map((entry) => entry.id)).toEqual(['b', 'c'])
  })
})
