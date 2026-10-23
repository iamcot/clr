import { describe, expect, it, vi } from 'vitest'
import { StravaNotConnectedError } from '@/lib/strava/errors'
import { TokenRequestError } from '@/lib/strava/oauth'
import { getValidAccessToken, type StoredTokens, type TokenStore } from '@/lib/strava/tokenService'

const NOW = new Date('2026-10-23T10:00:00Z')

function tokensExpiringIn(minutes: number, suffix = ''): StoredTokens {
  return {
    accessToken: `access${suffix}`,
    refreshToken: `refresh${suffix}`,
    expiresAt: new Date(NOW.getTime() + minutes * 60 * 1000),
  }
}

function makeStore(initial: StoredTokens | null, saveResult = true) {
  const store = {
    read: vi.fn().mockResolvedValue(initial),
    saveIfUnchanged: vi.fn().mockResolvedValue(saveResult),
    markDisconnected: vi.fn().mockResolvedValue(undefined),
  } satisfies TokenStore
  return store
}

describe('getValidAccessToken', () => {
  it('dùng token hiện có khi còn hạn trên 5 phút', async () => {
    const store = makeStore(tokensExpiringIn(60))
    const refresh = vi.fn()

    const token = await getValidAccessToken({ store, refresh, now: () => NOW }, 'm1')

    expect(token).toBe('access')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('token hết hạn: refresh đúng một lần và lưu refresh token mới', async () => {
    const store = makeStore(tokensExpiringIn(2))
    const renewed = tokensExpiringIn(360, '2')
    const refresh = vi.fn().mockResolvedValue(renewed)

    const token = await getValidAccessToken({ store, refresh, now: () => NOW }, 'm1')

    expect(token).toBe('access2')
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledWith('refresh')
    expect(store.saveIfUnchanged).toHaveBeenCalledWith('m1', renewed, 'refresh')
  })

  it('forceRefresh làm mới dù token còn hạn', async () => {
    const store = makeStore(tokensExpiringIn(60))
    const refresh = vi.fn().mockResolvedValue(tokensExpiringIn(360, '2'))

    await getValidAccessToken({ store, refresh, now: () => NOW }, 'm1', { forceRefresh: true })

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('thua cuộc đua làm mới thì dùng token đã được lưu bởi tiến trình khác', async () => {
    const store = makeStore(tokensExpiringIn(2), false)
    store.read.mockResolvedValueOnce(tokensExpiringIn(2)).mockResolvedValueOnce(tokensExpiringIn(360, '3'))
    const refresh = vi.fn().mockResolvedValue(tokensExpiringIn(360, '2'))

    const token = await getValidAccessToken({ store, refresh, now: () => NOW }, 'm1')

    expect(token).toBe('access3')
  })

  it('refresh token bị thu hồi: đánh dấu mất kết nối', async () => {
    const store = makeStore(tokensExpiringIn(2))
    const refresh = vi.fn().mockRejectedValue(new TokenRequestError(400))

    await expect(getValidAccessToken({ store, refresh, now: () => NOW }, 'm1')).rejects.toBeInstanceOf(
      StravaNotConnectedError,
    )
    expect(store.markDisconnected).toHaveBeenCalledWith('m1')
  })

  it('lỗi Strava tạm thời không đánh dấu mất kết nối', async () => {
    const store = makeStore(tokensExpiringIn(2))
    const refresh = vi.fn().mockRejectedValue(new TokenRequestError(503))

    await expect(getValidAccessToken({ store, refresh, now: () => NOW }, 'm1')).rejects.toBeInstanceOf(
      TokenRequestError,
    )
    expect(store.markDisconnected).not.toHaveBeenCalled()
  })

  it('báo lỗi khi thành viên chưa có token', async () => {
    const store = makeStore(null)
    await expect(getValidAccessToken({ store, refresh: vi.fn(), now: () => NOW }, 'm1')).rejects.toBeInstanceOf(
      StravaNotConnectedError,
    )
  })
})
