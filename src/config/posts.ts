export const POST_KINDS = ['announcement', 'result', 'event', 'system'] as const
export type PostKind = (typeof POST_KINDS)[number]

export const POST_KIND_LABELS: Record<PostKind, string> = {
  announcement: 'Thông báo',
  result: 'Kết quả',
  event: 'Event',
  system: 'Tự động',
}

export const REACTIONS = [
  { code: 'like', symbol: '👍', label: 'Thích' },
  { code: 'fire', symbol: '🔥', label: 'Tuyệt' },
  { code: 'clap', symbol: '👏', label: 'Vỗ tay' },
  { code: 'heart', symbol: '❤️', label: 'Yêu thích' },
] as const
export type ReactionCode = (typeof REACTIONS)[number]['code']
export const HEART_REACTION: ReactionCode = 'heart'

export const FEED_PAGE_SIZE = 20
export const MAX_PINNED_POSTS = 3
export const COMMENT_MAX_LENGTH = 2000
export const POST_EXCERPT_LENGTH = 140
export const COMMENT_LIST_LIMIT = 300
export const POST_ADMIN_LIST_LIMIT = 200
export const ACK_LIST_LIMIT = 1000

// Số người nhận kết quả challenge trên bài tự sinh và số dòng top mỗi hạng mục
export const AUTO_POST_TOP_PER_CATEGORY = 3
export const AUTO_POST_SETTING_KEY = 'auto_posts_publish'
export const LEVEL_DIGEST_DAYS = 7
