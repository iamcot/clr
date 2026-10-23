import { describe, expect, it, vi } from 'vitest'
import { createStravaClient } from '@/lib/strava/client'
import { RateLimitedError, StravaApiError } from '@/lib/strava/errors'

const NOW = new Date('2026-10-23T10:07:00Z')
const RATE_HEADERS = {
  'X-ReadRateLimit-Limit': '100,1000',
  'X-ReadRateLimit-Usage': '5,50',
  'X-RateLimit-Limit': '200,2000',
  'X-RateLimit-Usage': '6,60',
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = RATE_HEADERS) {
  return new Response(JSON.stringify(body), { status, headers })
}

function makeClient(responses: Response[]) {
  const fetchFn = vi.fn()
  responses.forEach((response) => fetchFn.mockResolvedValueOnce(response))
  const getAccessToken = vi.fn().mockResolvedValue('token')
  const saveRateSnapshot = vi.fn().mockResolvedValue(undefined)
  const client = createStravaClient({
    fetchFn,
    getAccessToken,
    loadRateSnapshot: vi.fn().mockResolvedValue({}),
    saveRateSnapshot,
    now: () => NOW,
  })
  return { client, fetchFn, getAccessToken, saveRateSnapshot }
}

describe('createStravaClient', () => {
  it('gọi chi tiết hoạt động kèm Bearer token và ghi lại hạn mức', async () => {
    const { client, fetchFn, saveRateSnapshot } = makeClient([jsonResponse({ id: 1 })])

    await expect(client.getActivity('m1', 1)).resolves.toEqual({ id: 1 })

    expect(fetchFn.mock.calls[0]![0]).toContain('/activities/1')
    expect(fetchFn.mock.calls[0]![1].headers.Authorization).toBe('Bearer token')
    expect(saveRateSnapshot.mock.calls[0]![0].read_15m.usage).toBe(5)
  })

  it('401: làm mới token rồi thử lại một lần', async () => {
    const { client, getAccessToken, fetchFn } = makeClient([jsonResponse({}, 401), jsonResponse({ id: 2 })])

    await expect(client.getActivity('m1', 2)).resolves.toEqual({ id: 2 })

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(getAccessToken).toHaveBeenLastCalledWith('m1', { forceRefresh: true })
  })

  it('429: báo RateLimited kèm thời điểm cửa sổ kế tiếp, không thử lại', async () => {
    const { client, fetchFn } = makeClient([jsonResponse({}, 429)])

    const error = await client.getActivity('m1', 3).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(RateLimitedError)
    expect((error as RateLimitedError).retryAt.toISOString()).toBe('2026-10-23T10:15:00.000Z')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('lỗi khác 2xx: ném StravaApiError', async () => {
    const { client } = makeClient([jsonResponse({}, 404, {})])
    await expect(client.getActivity('m1', 4)).rejects.toBeInstanceOf(StravaApiError)
  })

  it('listActivities đổi mốc thời gian sang epoch giây', async () => {
    const { client, fetchFn } = makeClient([jsonResponse([])])

    await client.listActivities('m1', { after: new Date('2026-01-01T00:00:00Z'), page: 2, perPage: 50 })

    const url = new URL(fetchFn.mock.calls[0]![0] as string)
    expect(url.searchParams.get('after')).toBe('1767225600')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('per_page')).toBe('50')
  })
})
