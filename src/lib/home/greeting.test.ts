import { describe, expect, it } from 'vitest'
import { formatWeekdayDate, givenName, greetingAt, greetingForHour, monthNumberAt } from '@/lib/home/greeting'

describe('greetingForHour', () => {
  it('chia theo buổi trong ngày', () => {
    expect(greetingForHour(6)).toBe('Chào buổi sáng')
    expect(greetingForHour(12)).toBe('Chào buổi trưa')
    expect(greetingForHour(15)).toBe('Chào buổi chiều')
    expect(greetingForHour(21)).toBe('Chào buổi tối')
  })
})

describe('giờ Việt Nam', () => {
  const moment = new Date('2026-10-22T18:30:00Z') // 01:30 ngày 23/10 giờ Việt Nam

  it('tính lời chào theo giờ Việt Nam', () => {
    expect(greetingAt(moment)).toBe('Chào buổi sáng')
  })

  it('định dạng thứ và ngày theo giờ Việt Nam', () => {
    expect(formatWeekdayDate(moment)).toBe('Thứ Sáu, 23/10')
  })

  it('lấy số tháng theo giờ Việt Nam', () => {
    expect(monthNumberAt(new Date('2026-09-30T17:30:00Z'))).toBe(10)
  })
})

describe('givenName', () => {
  it('lấy chữ cuối của họ tên', () => {
    expect(givenName('Nguyễn Văn Minh')).toBe('Minh')
  })

  it('trả về "bạn" khi chưa có tên', () => {
    expect(givenName(null)).toBe('bạn')
    expect(givenName('  ')).toBe('bạn')
  })
})
