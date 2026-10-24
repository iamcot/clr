export const DRAW_SOURCE_TYPES = ['challenge_completed', 'event_checked_in', 'manual'] as const
export type DrawSourceType = (typeof DRAW_SOURCE_TYPES)[number]

export const DRAW_SOURCE_LABELS: Record<DrawSourceType, string> = {
  challenge_completed: 'Người hoàn thành challenge',
  event_checked_in: 'Người đã điểm danh event',
  manual: 'Chọn tay',
}

export const DRAW_STATUSES = ['draft', 'live', 'done', 'cancelled'] as const
export type DrawStatus = (typeof DRAW_STATUSES)[number]

export const DRAW_STATUS_LABELS: Record<DrawStatus, string> = {
  draft: 'Đang chuẩn bị',
  live: 'Đang quay',
  done: 'Đã quay xong',
  cancelled: 'Đã huỷ',
}

// Mỗi người chỉ trúng tối đa một giải
export const ONE_PRIZE_PER_MEMBER = true

export const DEFAULT_PARTICIPANT_WEIGHT = 1

export const DRAW_STYLES = ['reel', 'race', 'duck'] as const
export type DrawStyle = (typeof DRAW_STYLES)[number]

// Hiệu ứng chạy từ lúc bấm quay tới reveal_at = bấm quay + durationMs
export const DRAW_STYLE_CONFIG: Record<DrawStyle, { label: string; durationMs: number }> = {
  reel: { label: 'Cuộn tên', durationMs: 10_000 },
  race: { label: 'Thi chạy bộ', durationMs: 15_000 },
  duck: { label: 'Đua vịt', durationMs: 15_000 },
}

// Người trúng chỉ được server trả về trong khoảng này trước reveal_at (và RLS chặn đọc trước reveal_at)
export const WINNER_REVEAL_LEAD_MS = 1500

// Đủ ít người thì hiện tên từng làn; nhiều người thì chỉ hiện tên nhóm đang dẫn đầu
export const FULL_NAMES_MAX_FIELD = 8
export const LEADER_LABEL_COUNT = 6

export const REEL_ITEM_HEIGHT_PX = 56
export const REEL_SPEED_PX_PER_MS = 1.4

export const SEED_BYTES = 32

// Hỏi trạng thái thưa lúc rảnh, dồn dập khi sắp tới lúc lộ người trúng
export const DRAW_POLL_IDLE_MS = 2000
export const DRAW_POLL_FAST_MS = 400
export const DRAW_POLL_FAST_WINDOW_MS = 4000
