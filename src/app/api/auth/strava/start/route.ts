import { NextResponse, type NextRequest } from 'next/server'
import { LOGIN_NEXT_COOKIE, safeNextPath } from '@/lib/auth/nextPath'
import { buildAuthorizeUrl, createOAuthState } from '@/lib/strava/oauth'
import { getStravaClientId, getStravaRedirectUri } from '@/lib/strava/env'
import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_OPTIONS } from '@/lib/strava/stateCookie'

export function GET(request: NextRequest) {
  const state = createOAuthState()
  const authorizeUrl = buildAuthorizeUrl({
    clientId: getStravaClientId(),
    redirectUri: getStravaRedirectUri(),
    state,
  })

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(OAUTH_STATE_COOKIE, state, OAUTH_STATE_COOKIE_OPTIONS)
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))
  if (next) response.cookies.set(LOGIN_NEXT_COOKIE, next, OAUTH_STATE_COOKIE_OPTIONS)
  return response
}
