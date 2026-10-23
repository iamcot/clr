export class RateLimitedError extends Error {
  constructor(readonly retryAt: Date) {
    super(`Strava giới hạn tốc độ, thử lại sau ${retryAt.toISOString()}`)
  }
}

export class StravaNotConnectedError extends Error {
  constructor(memberId: string) {
    super(`Thành viên ${memberId} chưa kết nối Strava hoặc đã mất quyền`)
  }
}

export class StravaApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`Strava trả lỗi ${status} cho ${path}`)
  }
}
