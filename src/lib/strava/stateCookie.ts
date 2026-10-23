export const OAUTH_STATE_COOKIE = 'strava_oauth_state'

export const OAUTH_STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/strava',
  maxAge: 10 * 60,
} as const
