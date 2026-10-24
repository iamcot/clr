import { describe, expect, it } from 'vitest'
import { countPrizeSlots, pickWinners, type DrawParticipant, type DrawPrize } from '@/lib/draw/pick'

const PARTICIPANTS: DrawParticipant[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((memberId) => ({ memberId, weight: 1 }))
const PRIZES: DrawPrize[] = [
  { id: 'p1', quantity: 1, sort: 1 },
  { id: 'p2', quantity: 2, sort: 2 },
]

describe('pickWinners', () => {
  it('cùng seed và cùng danh sách thì cùng kết quả', () => {
    expect(pickWinners(PARTICIPANTS, PRIZES, 12345, true)).toEqual(pickWinners(PARTICIPANTS, PRIZES, 12345, true))
  })

  it('đổi thứ tự đầu vào vẫn ra cùng kết quả', () => {
    const shuffledParticipants = [...PARTICIPANTS].reverse()
    const shuffledPrizes = [...PRIZES].reverse()
    expect(pickWinners(shuffledParticipants, shuffledPrizes, 777, true)).toEqual(
      pickWinners(PARTICIPANTS, PRIZES, 777, true),
    )
  })

  it('xếp giải theo sort và đánh số thứ tự quay', () => {
    const picks = pickWinners(PARTICIPANTS, PRIZES, 1, true)
    expect(picks.map((pick) => [pick.order, pick.prizeId])).toEqual([
      [1, 'p1'],
      [2, 'p2'],
      [3, 'p2'],
    ])
  })

  it('mỗi người chỉ trúng một giải khi bật giới hạn', () => {
    const picks = pickWinners(PARTICIPANTS, PRIZES, 99, true)
    expect(new Set(picks.map((pick) => pick.memberId)).size).toBe(picks.length)
  })

  it('hết người thì dừng, không quay quá số người', () => {
    const picks = pickWinners(PARTICIPANTS.slice(0, 2), PRIZES, 5, true)
    expect(picks).toHaveLength(2)
  })

  it('người có trọng số lớn trúng nhiều hơn', () => {
    const weighted: DrawParticipant[] = [
      { memberId: 'a', weight: 9 },
      { memberId: 'b', weight: 1 },
    ]
    const prize: DrawPrize[] = [{ id: 'p', quantity: 1, sort: 1 }]
    let aWins = 0
    for (let seed = 0; seed < 2000; seed += 1) {
      if (pickWinners(weighted, prize, seed, true)[0]?.memberId === 'a') aWins += 1
    }
    expect(aWins / 2000).toBeGreaterThan(0.85)
  })

  it('phân bố đều: 10.000 lần quay, mỗi người trúng xấp xỉ đều', () => {
    const five = PARTICIPANTS.slice(0, 5)
    const prize: DrawPrize[] = [{ id: 'p', quantity: 1, sort: 1 }]
    const wins = new Map<string, number>()
    const runs = 10000
    for (let seed = 1; seed <= runs; seed += 1) {
      const winner = pickWinners(five, prize, seed * 2654435761, true)[0]?.memberId ?? ''
      wins.set(winner, (wins.get(winner) ?? 0) + 1)
    }
    const expected = runs / five.length
    for (const participant of five) {
      expect(Math.abs((wins.get(participant.memberId) ?? 0) - expected) / expected).toBeLessThan(0.05)
    }
  })
})

describe('countPrizeSlots', () => {
  it('cộng số lượng mọi giải', () => {
    expect(countPrizeSlots(PRIZES)).toBe(3)
  })
})
