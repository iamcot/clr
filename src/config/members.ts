import type { MemberRole, MemberStatus, MemberType } from '@/lib/types/database'

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Ngưng',
  rejected: 'Từ chối',
}

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  official: 'Chính thức',
  free: 'Tự do',
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  guest: 'Khách',
  member: 'Thành viên',
  bcn: 'BCN',
  treasurer: 'Thủ quỹ',
}

export const MEMBER_STATUSES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]
export const MEMBER_TYPES = Object.keys(MEMBER_TYPE_LABELS) as MemberType[]
export const MEMBER_ROLES = Object.keys(MEMBER_ROLE_LABELS) as MemberRole[]

export const ADMIN_MEMBER_PAGE_SIZE = 100
export const MEMBER_DIRECTORY_PAGE_SIZE = 200
export const MEMBER_HISTORY_LIMIT = 50
export const FRIEND_FEED_LIMIT = 20
export const OVERVIEW_ACTIVITY_DAYS = 7

export const HOME_EVENT_LIMIT = 2
export const HOME_CHALLENGE_LIMIT = 3
export const HIGHLIGHT_WINDOW_DAYS = 30
export const HIGHLIGHT_LIMIT = 40
