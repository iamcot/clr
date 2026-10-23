import { NextResponse } from 'next/server'
import { buildAuthorizeUrl, createOAuthState } from '@/lib/strava/oauth'
import { getStravaClientId, getStravaRedirectUri } from '@/lib/strava/env'
import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_OPTIONS } from '@/lib/strava/stateCookie'

export function GET() {
  const state = createOAuthState()
  const authorizeUrl = buildAuthorizeUrl({
    clientId: getStravaClientId(),
    redirectUri: getStravaRedirectUri(),
    state,
  })

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(OAUTH_STATE_COOKIE, state, OAUTH_STATE_COOKIE_OPTIONS)
  return response
}
