export const GOAL_TYPES = [
  'total_distance',
  'active_days',
  'activity_count',
  'total_elevation',
  'single_distance',
] as const
export type GoalType = (typeof GOAL_TYPES)[number]

export const PARTICIPATION_MODES = ['mandatory_official', 'opt_in', 'invite'] as const
export type ParticipationMode = (typeof PARTICIPATION_MODES)[number]

export const RANKING_MODES = ['value_desc', 'completed_at_asc'] as const
export type RankingMode = (typeof RANKING_MODES)[number]

export const CHALLENGE_STATUSES = ['draft', 'published', 'running', 'finalizing', 'closed'] as const
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number]

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  total_distance: 'Tổng quãng đường',
  active_days: 'Số ngày có chạy',
  activity_count: 'Số buổi chạy',
  total_elevation: 'Tổng độ cao',
  single_distance: 'Một buổi chạy dài',
}

export const PARTICIPATION_LABELS: Record<ParticipationMode, string> = {
  mandatory_official: 'Bắt buộc với thành viên chính thức',
  opt_in: 'Tự đăng ký',
  invite: 'BCN chọn người',
}

export const RANKING_LABELS: Record<RankingMode, string> = {
  value_desc: 'Ai nhiều hơn xếp trên',
  completed_at_asc: 'Ai hoàn thành trước xếp trên',
}

export const STATUS_LABELS: Record<ChallengeStatus, string> = {
  draft: 'Nháp',
  published: 'Sắp diễn ra',
  running: 'Đang diễn ra',
  finalizing: 'Đang chốt',
  closed: 'Đã kết thúc',
}

// Đơn vị nhập cho form: quãng đường nhập km, lưu mét
export const KM_GOAL_TYPES: readonly GoalType[] = ['total_distance', 'single_distance']

export const GOAL_UNIT_LABELS: Record<GoalType, string> = {
  total_distance: 'km',
  single_distance: 'km',
  total_elevation: 'm',
  active_days: 'ngày',
  activity_count: 'buổi',
}

export const DEFAULT_REGISTRATION_GRACE_HOURS = 48
export const MAX_CATEGORIES_IN_FORM = 4
export const MAX_ENTRIES_IN_LIST = 1000

// BCN đọc được cả bản nháp qua RLS, nên danh sách cho thành viên phải tự loại bản nháp
export const MEMBER_VISIBLE_STATUSES: ChallengeStatus[] = ['published', 'running', 'finalizing', 'closed']
