import { describe, expect, it } from 'vitest'
import { formatDuration, formatKm, formatPace, parseDuration } from '@/lib/stats/format'

describe('formatPace', () => {
  it('đổi quãng đường và thời gian sang m:ss/km', () => {
    expect(formatPace(5000, 1500)).toBe('5:00/km')
    expect(formatPace(10000, 3125)).toBe('5:13/km')
  })

  it('trả -- khi thiếu dữ liệu', () => {
    expect(formatPace(0, 100)).toBe('--')
  })
})

describe('formatDuration', () => {
  it('có giờ thì hiện h:mm:ss', () => {
    expect(formatDuration(3725)).toBe('1:02:05')
  })

  it('dưới một giờ thì hiện mm:ss', () => {
    expect(formatDuration(1500)).toBe('25:00')
  })
})

describe('formatKm', () => {
  it('dùng dấu phẩy thập phân', () => {
    expect(formatKm(12340)).toBe('12,3 km')
  })

  it('chưa chạy km nào thì hiện 0, không hiện 0,0', () => {
    expect(formatKm(0)).toBe('0 km')
    expect(formatKm(40)).toBe('0 km')
  })
})

describe('parseDuration', () => {
  it('đọc h:mm:ss và mm:ss', () => {
    expect(parseDuration('1:45:12')).toBe(6312)
    expect(parseDuration('24:30')).toBe(1470)
  })

  it('từ chối định dạng sai', () => {
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('1:75:00')).toBeNull()
    expect(parseDuration('90')).toBeNull()
    expect(parseDuration('0:00')).toBeNull()
  })
})
