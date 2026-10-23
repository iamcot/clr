import { STRAVA_API_BASE_URL } from '@/config/strava'
import { RateLimitedError, StravaApiError } from '@/lib/strava/errors'
import type { StravaActivityJson } from '@/lib/strava/mapActivity'
import { parseRateHeaders, retryTimeAfterRateLimit, type RateSnapshot } from '@/lib/strava/rateLimit'

export type ListActivitiesParams = {
  after?: Date
  before?: Date
  page?: number
  perPage?: number
}

export type StravaClientDeps = {
  fetchFn: typeof fetch
  getAccessToken: (memberId: string, options?: { forceRefresh?: boolean }) => Promise<string>
  loadRateSnapshot: () => Promise<RateSnapshot>
  saveRateSnapshot: (snapshot: RateSnapshot) => Promise<void>
  now: () => Date
}

function toEpochSeconds(date: Date): string {
  return String(Math.floor(date.getTime() / 1000))
}

function buildListQuery(params: ListActivitiesParams): string {
  const query = new URLSearchParams()
  if (params.after) query.set('after', toEpochSeconds(params.after))
  if (params.before) query.set('before', toEpochSeconds(params.before))
  query.set('page', String(params.page ?? 1))
  query.set('per_page', String(params.perPage ?? 200))
  return query.toString()
}

export function createStravaClient(deps: StravaClientDeps) {
  async function recordUsage(headers: Headers): Promise<RateSnapshot> {
    const reported = parseRateHeaders(headers, deps.now())
    if (Object.keys(reported).length === 0) return reported
    await deps.saveRateSnapshot(reported)
    return reported
  }

  async function send(path: string, accessToken: string): Promise<Response> {
    return deps.fetchFn(`${STRAVA_API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  }

  async function requestJson<T>(memberId: string, path: string): Promise<T> {
    let response = await send(path, await deps.getAccessToken(memberId))
    if (response.status === 401) {
      response = await send(path, await deps.getAccessToken(memberId, { forceRefresh: true }))
    }

    const reported = await recordUsage(response.headers)
    if (response.status === 429) {
      const known = { ...(await deps.loadRateSnapshot()), ...reported }
      throw new RateLimitedError(retryTimeAfterRateLimit(known, deps.now()))
    }
    if (!response.ok) throw new StravaApiError(response.status, path)
    return (await response.json()) as T
  }

  return {
    getActivity: (memberId: string, activityId: number) =>
      requestJson<StravaActivityJson>(memberId, `/activities/${activityId}?include_all_efforts=false`),
    listActivities: (memberId: string, params: ListActivitiesParams) =>
      requestJson<StravaActivityJson[]>(memberId, `/athlete/activities?${buildListQuery(params)}`),
    getAthlete: (memberId: string) => requestJson<Record<string, unknown>>(memberId, '/athlete'),
  }
}

export type StravaClient = ReturnType<typeof createStravaClient>
