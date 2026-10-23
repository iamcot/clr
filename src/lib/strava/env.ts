import { getAppUrl, requireEnv } from '@/lib/env'

export function getStravaClientId() {
  return requireEnv('STRAVA_CLIENT_ID')
}

export function getStravaClientSecret() {
  return requireEnv('STRAVA_CLIENT_SECRET')
}

export function getTokenEncKey() {
  return requireEnv('TOKEN_ENC_KEY')
}

export function getStravaRedirectUri() {
  return `${getAppUrl()}/api/auth/strava/callback`
}
