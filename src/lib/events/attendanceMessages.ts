import type { AttendanceStatus } from '@/lib/types/database'

const RESULT_TEXT: Record<AttendanceStatus, string> = {
  going: 'Đã đăng ký tham gia',
  maybe: 'Đã ghi nhận: có thể đi',
  not_going: 'Đã ghi nhận: không đi',
  waitlist: 'Event đã hết chỗ, bạn vào danh sách chờ',
}

const ERROR_TEXT: Record<string, string> = {
  registration_closed: 'Đã hết hạn đăng ký',
  event_not_open: 'Event không còn nhận đăng ký',
  not_member: 'Chỉ thành viên đang hoạt động mới đăng ký được',
}

const FALLBACK_ERROR = 'Không đăng ký được, vui lòng thử lại'

export function attendanceResultText(status: AttendanceStatus): string {
  return RESULT_TEXT[status]
}

export function attendanceErrorText(errorMessage: string): string {
  const code = Object.keys(ERROR_TEXT).find((key) => errorMessage.includes(key))
  return code ? (ERROR_TEXT[code] ?? FALLBACK_ERROR) : FALLBACK_ERROR
}
