import 'server-only'
import { createStravaClient } from '@/lib/strava/client'
import { getStravaClientId, getStravaClientSecret } from '@/lib/strava/env'
import { disconnectLocally } from '@/lib/strava/localData'
import { refreshToken } from '@/lib/strava/oauth'
import { canSpend, type SpendPurpose } from '@/lib/strava/rateLimit'
import { createSupabaseRateStore } from '@/lib/strava/rateStore'
import { createSupabaseTokenStore } from '@/lib/strava/tokenStore'
import { getValidAccessToken } from '@/lib/strava/tokenService'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export function getServerStravaTokenService() {
  const db = createSupabaseServiceClient()
  const deps = {
    store: createSupabaseTokenStore(db, (memberId) => disconnectLocally(db, memberId)),
    refresh: (token: string) =>
      refreshToken(fetch, {
        clientId: getStravaClientId(),
        clientSecret: getStravaClientSecret(),
        refreshToken: token,
      }),
    now: () => new Date(),
  }
  return {
    getAccessToken: (memberId: string, options?: { forceRefresh?: boolean }) =>
      getValidAccessToken(deps, memberId, options),
  }
}

export function getServerStravaClient() {
  const rateStore = createSupabaseRateStore(createSupabaseServiceClient())
  return createStravaClient({
    fetchFn: fetch,
    getAccessToken: getServerStravaTokenService().getAccessToken,
    loadRateSnapshot: rateStore.load,
    saveRateSnapshot: rateStore.save,
    now: () => new Date(),
  })
}

export async function canSpendStravaRequest(purpose: SpendPurpose): Promise<boolean> {
  const snapshot = await createSupabaseRateStore(createSupabaseServiceClient()).load()
  return canSpend(snapshot, purpose, new Date())
}
