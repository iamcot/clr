import { describe, expect, it, vi } from 'vitest'
import {
  buildAuthorizeUrl,
  checkCallback,
  createOAuthState,
  exchangeCode,
  refreshToken,
  revokeAccess,
} from '@/lib/strava/oauth'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

const validParams = { code: 'abc', state: 'xyz', error: null, scope: 'read,activity:read_all' }

describe('buildAuthorizeUrl', () => {
  it('có đủ tham số Strava yêu cầu', () => {
    const url = new URL(buildAuthorizeUrl({ clientId: '123', redirectUri: 'https://clr.test/cb', state: 'xyz' }))
    expect(url.origin + url.pathname).toBe('https://www.strava.com/oauth/mobile/authorize')
    expect(url.searchParams.get('client_id')).toBe('123')
    expect(url.searchParams.get('redirect_uri')).toBe('https://clr.test/cb')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('scope')).toBe('read,activity:read_all')
    expect(url.searchParams.get('state')).toBe('xyz')
  })
})

describe('createOAuthState', () => {
  it('mỗi lần tạo ra một chuỗi khác nhau', () => {
    expect(createOAuthState()).not.toBe(createOAuthState())
  })
})

describe('checkCallback', () => {
  it('chấp nhận khi state khớp và đủ scope', () => {
    expect(checkCallback(validParams, 'xyz')).toEqual({ ok: true, code: 'abc', scope: 'read,activity:read_all' })
  })

  it('từ chối khi người dùng bấm hủy ở Strava', () => {
    expect(checkCallback({ ...validParams, code: null, error: 'access_denied' }, 'xyz')).toEqual({
      ok: false,
      reason: 'denied',
    })
  })

  it('từ chối khi state sai hoặc không có cookie', () => {
    expect(checkCallback({ ...validParams, state: 'sai' }, 'xyz')).toEqual({ ok: false, reason: 'state' })
    expect(checkCallback(validParams, null)).toEqual({ ok: false, reason: 'state' })
  })

  it('từ chối khi thiếu quyền đọc hoạt động riêng tư', () => {
    expect(checkCallback({ ...validParams, scope: 'read,activity:read' }, 'xyz')).toEqual({
      ok: false,
      reason: 'scope',
    })
  })
})

describe('exchangeCode', () => {
  it('đổi code lấy token và thông tin vận động viên', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: 'at',
        refresh_token: 'rt',
        expires_at: 1_800_000_000,
        athlete: { id: 42, firstname: 'An', lastname: 'Nguyễn', profile: 'https://img/a.jpg', sex: 'F' },
      }),
    )

    const result = await exchangeCode(fetchFn, { clientId: '1', clientSecret: 's', code: 'abc' })

    expect(result.accessToken).toBe('at')
    expect(result.refreshToken).toBe('rt')
    expect(result.expiresAt.toISOString()).toBe('2027-01-15T08:00:00.000Z')
    expect(result.athlete).toEqual({
      id: 42,
      firstname: 'An',
      lastname: 'Nguyễn',
      profile: 'https://img/a.jpg',
      sex: 'F',
    })
    const sentBody = JSON.parse(fetchFn.mock.calls[0]![1].body as string)
    expect(sentBody).toMatchObject({ code: 'abc', grant_type: 'authorization_code' })
  })

  it('báo lỗi khi Strava trả mã lỗi', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 400))
    await expect(exchangeCode(fetchFn, { clientId: '1', clientSecret: 's', code: 'abc' })).rejects.toThrow()
  })

  it('báo lỗi khi phản hồi thiếu thông tin vận động viên', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'a', refresh_token: 'r', expires_at: 1 }))
    await expect(exchangeCode(fetchFn, { clientId: '1', clientSecret: 's', code: 'abc' })).rejects.toThrow()
  })
})

describe('refreshToken', () => {
  it('lấy token mới từ refresh token', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ access_token: 'at2', refresh_token: 'rt2', expires_at: 1_800_000_000 }))

    const result = await refreshToken(fetchFn, { clientId: '1', clientSecret: 's', refreshToken: 'rt' })

    expect(result.accessToken).toBe('at2')
    expect(result.refreshToken).toBe('rt2')
  })
})

describe('revokeAccess', () => {
  it('gọi oauth/revoke với Basic auth và token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    await revokeAccess(fetchFn, { clientId: '1', clientSecret: 's', token: 'at' })

    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe('https://www.strava.com/oauth/revoke')
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('1:s').toString('base64')}`)
    expect((init.body as URLSearchParams).get('token')).toBe('at')
  })

  it('báo lỗi khi Strava từ chối', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    await expect(revokeAccess(fetchFn, { clientId: '1', clientSecret: 's', token: 'at' })).rejects.toThrow()
  })
})
