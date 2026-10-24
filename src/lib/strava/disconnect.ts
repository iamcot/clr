import 'server-only'
import { disconnectLocally } from '@/lib/strava/localData'
import { getStravaClientId, getStravaClientSecret } from '@/lib/strava/env'
import { revokeAccess } from '@/lib/strava/oauth'
import { getServerStravaTokenService } from '@/lib/strava/serverClient'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function disconnectFromStrava(memberId: string) {
  const db = createSupabaseServiceClient()
  try {
    const accessToken = await getServerStravaTokenService().getAccessToken(memberId)
    await revokeAccess(fetch, {
      clientId: getStravaClientId(),
      clientSecret: getStravaClientSecret(),
      token: accessToken,
    })
  } catch (error) {
    console.warn('Không gọi được revoke của Strava, vẫn xoá dữ liệu cục bộ', error)
  }
  await disconnectLocally(db, memberId)
}
