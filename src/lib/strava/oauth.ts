import { randomBytes, timingSafeEqual } from 'node:crypto'

const AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize'
const TOKEN_URL = 'https://www.strava.com/oauth/token'
const REQUESTED_SCOPE = 'read,activity:read_all'
const REQUIRED_SCOPE = 'activity:read_all'

const REVOKE_URL = 'https://www.strava.com/oauth/revoke'

type FetchFn = typeof fetch

export class TokenRequestError extends Error {
  constructor(readonly status: number) {
    super(`Strava trả lỗi ${status} khi lấy token`)
  }
}

export type StravaAthlete = {
  id: number
  firstname: string | null
  lastname: string | null
  profile: string | null
  sex: 'M' | 'F' | null
}

export type StravaTokenSet = {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export type StravaAuthResult = StravaTokenSet & { athlete: StravaAthlete }

export type CallbackParams = {
  code: string | null
  state: string | null
  error: string | null
  scope: string | null
}

export type CallbackCheck =
  | { ok: true; code: string; scope: string }
  | { ok: false; reason: 'denied' | 'state' | 'scope' }

export function createOAuthState(): string {
  return randomBytes(24).toString('base64url')
}

function isSameState(received: string, expected: string): boolean {
  const receivedBytes = Buffer.from(received)
  const expectedBytes = Buffer.from(expected)
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
}

export function buildAuthorizeUrl(options: { clientId: string; redirectUri: string; state: string }): string {
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('client_id', options.clientId)
  url.searchParams.set('redirect_uri', options.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('approval_prompt', 'auto')
  url.searchParams.set('scope', REQUESTED_SCOPE)
  url.searchParams.set('state', options.state)
  return url.toString()
}

// Strava trả về scope người dùng thực sự chấp nhận, có thể ít hơn scope đã xin
export function checkCallback(params: CallbackParams, expectedState: string | null): CallbackCheck {
  if (params.error || !params.code) return { ok: false, reason: 'denied' }
  if (!params.state || !expectedState || !isSameState(params.state, expectedState)) {
    return { ok: false, reason: 'state' }
  }
  const grantedScope = params.scope ?? ''
  if (!grantedScope.split(',').includes(REQUIRED_SCOPE)) return { ok: false, reason: 'scope' }
  return { ok: true, code: params.code, scope: grantedScope }
}

async function postToken(fetchFn: FetchFn, body: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new TokenRequestError(response.status)
  return (await response.json()) as Record<string, unknown>
}

function toTokenSet(payload: Record<string, unknown>): StravaTokenSet {
  const { access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt } = payload
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string' || typeof expiresAt !== 'number') {
    throw new Error('Phản hồi token của Strava thiếu trường')
  }
  return { accessToken, refreshToken, expiresAt: new Date(expiresAt * 1000) }
}

function toAthlete(payload: unknown): StravaAthlete {
  const athlete = (payload ?? {}) as Record<string, unknown>
  if (typeof athlete.id !== 'number') throw new Error('Phản hồi của Strava thiếu thông tin vận động viên')
  return {
    id: athlete.id,
    firstname: typeof athlete.firstname === 'string' ? athlete.firstname : null,
    lastname: typeof athlete.lastname === 'string' ? athlete.lastname : null,
    profile: typeof athlete.profile === 'string' ? athlete.profile : null,
    sex: athlete.sex === 'M' || athlete.sex === 'F' ? athlete.sex : null,
  }
}

export async function exchangeCode(
  fetchFn: FetchFn,
  options: { clientId: string; clientSecret: string; code: string },
): Promise<StravaAuthResult> {
  const payload = await postToken(fetchFn, {
    client_id: options.clientId,
    client_secret: options.clientSecret,
    code: options.code,
    grant_type: 'authorization_code',
  })
  return { ...toTokenSet(payload), athlete: toAthlete(payload.athlete) }
}

export async function refreshToken(
  fetchFn: FetchFn,
  options: { clientId: string; clientSecret: string; refreshToken: string },
): Promise<StravaTokenSet> {
  const payload = await postToken(fetchFn, {
    client_id: options.clientId,
    client_secret: options.clientSecret,
    refresh_token: options.refreshToken,
    grant_type: 'refresh_token',
  })
  return toTokenSet(payload)
}

export async function revokeAccess(
  fetchFn: FetchFn,
  options: { clientId: string; clientSecret: string; token: string },
): Promise<void> {
  const credentials = Buffer.from(`${options.clientId}:${options.clientSecret}`).toString('base64')
  const response = await fetchFn(REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${credentials}` },
    body: new URLSearchParams({ token: options.token, token_type_hint: 'access_token' }),
  })
  if (!response.ok) throw new TokenRequestError(response.status)
}
