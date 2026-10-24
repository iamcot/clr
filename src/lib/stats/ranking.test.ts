import { describe, expect, it } from 'vitest'
import { buildRankingPage, type RankingRow } from '@/lib/stats/ranking'

function row(id: string, monthKm: number, overrides: Partial<RankingRow> = {}): RankingRow {
  return {
    memberId: id,
    displayName: id,
    avatarUrl: null,
    memberType: 'official',
    gender: 'M',
    level: 1,
    clubPoints: 0,
    monthDistanceMeters: monthKm * 1000,
    yearDistanceMeters: monthKm * 1000,
    ...overrides,
  }
}

const NO_FILTER = { gender: null, memberType: null }

describe('buildRankingPage', () => {
  it('xếp theo km giảm dần, cùng km cùng hạng', () => {
    const page = buildRankingPage([row('a', 10), row('b', 30), row('c', 10)], 'month', NO_FILTER, 'x', 1, 50)
    expect(page.rows.map((item) => [item.memberId, item.rank])).toEqual([
      ['b', 1],
      ['a', 2],
      ['c', 2],
    ])
  })

  it('người ngoài trang đầu vẫn có dòng riêng ghim cuối', () => {
    const rows = Array.from({ length: 10 }, (_, index) => row(`m${index}`, 100 - index))
    const page = buildRankingPage(rows, 'month', NO_FILTER, 'm7', 1, 5)
    expect(page.rows).toHaveLength(5)
    expect(page.ownRow?.rank).toBe(8)
    expect(page.hasMore).toBe(true)
  })

  it('người trong trang đầu không bị lặp ở dòng riêng', () => {
    const page = buildRankingPage([row('a', 10), row('b', 5)], 'month', NO_FILTER, 'a', 1, 50)
    expect(page.ownRow).toBeNull()
  })

  it('trang 2 hiện thêm hàng', () => {
    const rows = Array.from({ length: 12 }, (_, index) => row(`m${index}`, 100 - index))
    const page = buildRankingPage(rows, 'month', NO_FILTER, 'x', 2, 5)
    expect(page.rows).toHaveLength(10)
    expect(page.hasMore).toBe(true)
  })

  it('lọc theo giới tính và loại thành viên', () => {
    const rows = [row('a', 10, { gender: 'F' }), row('b', 20, { gender: 'M' }), row('c', 5, { memberType: 'free' })]
    expect(buildRankingPage(rows, 'month', { gender: 'F', memberType: null }, 'x', 1, 50).total).toBe(1)
    expect(buildRankingPage(rows, 'month', { gender: null, memberType: 'free' }, 'x', 1, 50).total).toBe(1)
  })

  it('tab level xếp theo level trước rồi điểm CLB', () => {
    const rows = [
      row('a', 0, { level: 2, clubPoints: 100 }),
      row('b', 0, { level: 3, clubPoints: 10 }),
      row('c', 0, { level: 2, clubPoints: 500 }),
    ]
    const page = buildRankingPage(rows, 'level', NO_FILTER, 'x', 1, 50)
    expect(page.rows.map((item) => item.memberId)).toEqual(['b', 'c', 'a'])
  })
})
