import { describe, expect, it } from 'vitest'
import { buildIcs } from '@/lib/events/ics'

const event = {
  id: 'abc',
  title: 'Chạy nhóm, sáng CN',
  description: 'Dòng 1\nDòng 2',
  locationName: 'Cổng chính; Celadon',
  startsAt: '2026-10-25T22:15:00.000Z',
  endsAt: '2026-10-26T00:00:00.000Z',
  url: 'https://clr.example/events/abc',
}

describe('buildIcs', () => {
  const text = buildIcs(event, new Date('2026-10-23T05:00:00Z'))

  it('dùng giờ UTC và định dạng iCalendar', () => {
    expect(text).toContain('DTSTART:20261025T221500Z')
    expect(text).toContain('DTEND:20261026T000000Z')
    expect(text).toContain('DTSTAMP:20261023T050000Z')
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('escape dấu phẩy, chấm phẩy và xuống dòng', () => {
    expect(text).toContain('SUMMARY:Chạy nhóm\\, sáng CN')
    expect(text).toContain('LOCATION:Cổng chính\; Celadon')
    expect(text).toContain('DESCRIPTION:Dòng 1\\nDòng 2')
  })
})
