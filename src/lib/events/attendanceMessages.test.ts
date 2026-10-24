import { describe, expect, it } from 'vitest'
import { attendanceErrorText, attendanceResultText } from '@/lib/events/attendanceMessages'

describe('attendanceMessages', () => {
  it('báo vào danh sách chờ khi hết chỗ', () => {
    expect(attendanceResultText('waitlist')).toContain('danh sách chờ')
  })

  it('đổi mã lỗi của Postgres thành câu tiếng Việt', () => {
    expect(attendanceErrorText('registration_closed')).toBe('Đã hết hạn đăng ký')
  })

  it('lỗi lạ thì báo chung', () => {
    expect(attendanceErrorText('connection reset')).toBe('Không đăng ký được, vui lòng thử lại')
  })
})
