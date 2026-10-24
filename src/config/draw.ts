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

// reveal_at = lúc bấm quay + REVEAL_DELAY_MS; hiệu ứng cuộn tên chạy REEL_ANIMATION_MS cuối cùng trước mốc đó,
// chừa thời gian cho các máy nhận thông báo realtime
export const REVEAL_DELAY_MS = 8000
export const REEL_ANIMATION_MS = 5000
export const REEL_NAME_COUNT = 40
export const REEL_ITEM_HEIGHT_PX = 56

export const SEED_BYTES = 32

// Người xem hỏi trạng thái quay số theo chu kỳ này khi đợt quay đang diễn ra (không phụ thuộc Realtime)
export const DRAW_POLL_INTERVAL_MS = 1500
