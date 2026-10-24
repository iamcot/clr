import type { AttendanceStatus, EventKind, EventStatus } from '@/lib/types/database'

export const EVENT_KINDS: readonly EventKind[] = ['group_run', 'race', 'social', 'charity', 'other']

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  group_run: 'Chạy nhóm',
  race: 'Giải chạy',
  social: 'Offline',
  charity: 'Từ thiện',
  other: 'Khác',
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Nháp',
  published: 'Đã công bố',
  cancelled: 'Đã huỷ',
  done: 'Đã xong',
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  going: 'Đi',
  maybe: 'Có thể',
  not_going: 'Không đi',
  waitlist: 'Danh sách chờ',
}

export const MEMBER_ATTENDANCE_CHOICES: readonly AttendanceStatus[] = ['going', 'maybe', 'not_going']

export const EVENT_TITLE_MAX_LENGTH = 200
export const EVENT_DESCRIPTION_MAX_LENGTH = 20000
export const EVENT_LIST_LIMIT = 100
export const EVENT_PARTICIPANT_PREVIEW = 12

// Khung giờ cho phép tự điểm danh: từ trước giờ bắt đầu tới sau giờ kết thúc
export const CHECKIN_OPENS_BEFORE_MS = 60 * 60 * 1000
export const CHECKIN_CLOSES_AFTER_MS = 3 * 60 * 60 * 1000

// Hoạt động Strava được tự gắn vào event khi bắt đầu trong khung này và xuất phát gần địa điểm
export const ACTIVITY_MATCH_WINDOW_MS = 60 * 60 * 1000
export const ACTIVITY_MATCH_RADIUS_M = 3000
// Chỉ quét event vừa kết thúc trong khoảng này để job định kỳ không phải xét event cũ
export const ACTIVITY_MATCH_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000

export const EVENT_ICS_PRODUCT_ID = '-//CLR//Events//VI'

export const EVENT_TOP_ATTENDEES_LIMIT = 10
