import { describe, expect, it } from 'vitest'
import { monthIndexVn, summarizeMembers, type SummaryEntry } from '@/lib/challenges/summary'

function entry(memberId: string, challengeId: string, startsAt: string, completed: boolean): SummaryEntry {
  return {
    memberId,
    challengeId,
    challengeStartsAt: startsAt,
    completed,
    excluded: false,
  }
}

describe('summarizeMembers', () => {
  const entries = [
    entry('a', 'c1', '2026-07-31T17:00:00Z', true),
    entry('a', 'c2', '2026-08-31T17:00:00Z', true),
    entry('a', 'c3', '2026-09-30T17:00:00Z', false),
    entry('b', 'c1', '2026-07-31T17:00:00Z', true),
    entry('b', 'c3', '2026-09-30T17:00:00Z', true),
  ]

  it('đếm số kỳ tham gia và hoàn thành', () => {
    const result = summarizeMembers(entries)
    expect(result.find((row) => row.memberId === 'a')).toMatchObject({
      joined: 3,
      completed: 2,
    })
    expect(result.find((row) => row.memberId === 'b')).toMatchObject({
      joined: 2,
      completed: 2,
    })
  })

  it('tính chuỗi tháng liên tiếp, tháng ngắt quãng thì chuỗi về 1', () => {
    const result = summarizeMembers(entries)
    expect(result.find((row) => row.memberId === 'a')).toMatchObject({
      longestStreak: 2,
      currentStreak: 0,
    })
    expect(result.find((row) => row.memberId === 'b')).toMatchObject({
      longestStreak: 1,
      currentStreak: 1,
    })
  })

  it('bỏ qua người bị loại', () => {
    const result = summarizeMembers([{ ...entry('x', 'c1', '2026-07-31T17:00:00Z', true), excluded: true }])
    expect(result).toEqual([])
  })

  it('tính tháng theo giờ Việt Nam', () => {
    expect(monthIndexVn('2026-07-31T17:00:00Z')).toBe(monthIndexVn('2026-08-01T00:30:00Z'))
  })
})
