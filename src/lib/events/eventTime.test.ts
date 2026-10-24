import { describe, expect, it } from 'vitest'
import { isCheckinOpen, isPastEvent, isRegistrationOpen, splitUpcomingAndPast } from '@/lib/events/eventTime'

const NOW = new Date('2026-10-23T12:00:00Z')
const HOUR = 3600 * 1000

const base = {
  startsAt: '2026-10-25T22:00:00Z',
  endsAt: '2026-10-26T00:00:00Z',
  status: 'published' as const,
  registrationClosesAt: null,
}

describe('isRegistrationOpen', () => {
  it('mở tới giờ bắt đầu khi không đặt hạn riêng', () => {
    expect(isRegistrationOpen(base, NOW)).toBe(true)
    expect(isRegistrationOpen(base, new Date('2026-10-25T22:00:00Z'))).toBe(false)
  })

  it('theo hạn đăng ký riêng', () => {
    const event = { ...base, registrationClosesAt: '2026-10-23T11:00:00Z' }
    expect(isRegistrationOpen(event, NOW)).toBe(false)
  })

  it('đóng khi chưa công bố hoặc đã huỷ', () => {
    expect(isRegistrationOpen({ ...base, status: 'draft' }, NOW)).toBe(false)
    expect(isRegistrationOpen({ ...base, status: 'cancelled' }, NOW)).toBe(false)
  })
})

describe('isPastEvent', () => {
  it('đã xong theo trạng thái hoặc theo giờ kết thúc', () => {
    expect(isPastEvent({ ...base, status: 'done' }, NOW)).toBe(true)
    expect(isPastEvent(base, new Date('2026-10-26T00:00:01Z'))).toBe(true)
    expect(isPastEvent(base, NOW)).toBe(false)
  })

  it('event huỷ chưa tới giờ vẫn nằm ở phần sắp tới', () => {
    expect(isPastEvent({ ...base, status: 'cancelled' }, NOW)).toBe(false)
  })
})

describe('splitUpcomingAndPast', () => {
  it('sắp tới gần nhất trước, đã qua mới nhất trước', () => {
    const early = { ...base, id: 'a', startsAt: '2026-10-24T00:00:00Z', endsAt: '2026-10-24T02:00:00Z' }
    const late = { ...base, id: 'b' }
    const oldDone = { ...base, id: 'c', status: 'done' as const, startsAt: '2026-09-01T00:00:00Z' }
    const newerDone = { ...base, id: 'd', status: 'done' as const, startsAt: '2026-10-01T00:00:00Z' }
    const result = splitUpcomingAndPast([late, oldDone, early, newerDone], NOW)
    expect(result.upcoming.map((event) => event.id)).toEqual(['a', 'b'])
    expect(result.past.map((event) => event.id)).toEqual(['d', 'c'])
  })
})

describe('isCheckinOpen', () => {
  const event = { startsAt: '2026-10-23T13:00:00Z', endsAt: '2026-10-23T15:00:00Z', status: 'published' as const }

  it('mở trong khung từ trước giờ bắt đầu tới sau giờ kết thúc', () => {
    expect(isCheckinOpen(event, new Date('2026-10-23T11:59:00Z'), HOUR, 3 * HOUR)).toBe(false)
    expect(isCheckinOpen(event, new Date('2026-10-23T12:30:00Z'), HOUR, 3 * HOUR)).toBe(true)
    expect(isCheckinOpen(event, new Date('2026-10-23T18:01:00Z'), HOUR, 3 * HOUR)).toBe(false)
  })
})
