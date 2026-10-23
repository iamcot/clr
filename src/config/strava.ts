export const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3'

// Giới hạn mặc định của app Strava, dùng khi chưa đọc được header từ Strava
export const DEFAULT_RATE_LIMITS = {
  read_15m: 100,
  read_day: 1000,
  all_15m: 200,
  all_day: 2000,
} as const

// Tỷ lệ hạn mức được phép dùng; việc nền chừa phần cho webhook
export const SPEND_THRESHOLDS = {
  background: { shortWindow: 0.8, day: 0.7 },
  webhook: { shortWindow: 1, day: 1 },
} as const

export const TOKEN_REFRESH_MARGIN_SECONDS = 5 * 60

export const EVENT_QUEUE = {
  batchSize: 20,
  maxAttempts: 5,
  baseRetryDelaySeconds: 60,
} as const

export const BACKFILL = {
  jobsPerRun: 20,
  pageSize: 200,
  detailsPerRun: 20,
  startFromPreviousYear: true,
} as const
