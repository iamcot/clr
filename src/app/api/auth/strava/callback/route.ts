import { NextResponse, type NextRequest } from 'next/server'
import { LOGIN_NEXT_COOKIE, safeNextPath } from '@/lib/auth/nextPath'
import { openSessionForEmail } from '@/lib/auth/openSession'
import { upsertMemberFromStrava } from '@/lib/auth/stravaMember'
import { getAppUrl } from '@/lib/env'
import { getStravaClientId, getStravaClientSecret } from '@/lib/strava/env'
import { checkCallback, exchangeCode } from '@/lib/strava/oauth'
import { OAUTH_STATE_COOKIE } from '@/lib/strava/stateCookie'

function redirectTo(path: string) {
  const response = NextResponse.redirect(`${getAppUrl()}${path}`)
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: '/api/auth/strava' })
  response.cookies.delete({ name: LOGIN_NEXT_COOKIE, path: '/api/auth/strava' })
  return response
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams
  const check = checkCallback(
    { code: query.get('code'), state: query.get('state'), error: query.get('error'), scope: query.get('scope') },
    request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? null,
  )
  if (!check.ok) return redirectTo(`/login?error=${check.reason}`)

  try {
    const auth = await exchangeCode(fetch, {
      clientId: getStravaClientId(),
      clientSecret: getStravaClientSecret(),
      code: check.code,
    })
    const member = await upsertMemberFromStrava(auth, check.scope)
    await openSessionForEmail(member.email)
    return redirectTo(safeNextPath(request.cookies.get(LOGIN_NEXT_COOKIE)?.value) ?? '/')
  } catch (error) {
    console.error('Đăng nhập Strava thất bại', error)
    return redirectTo('/login?error=failed')
  }
}
