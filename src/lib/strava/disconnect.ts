import 'server-only'
import { disconnectLocally } from '@/lib/strava/localData'
import { deauthorize } from '@/lib/strava/oauth'
import { getServerStravaTokenService } from '@/lib/strava/serverClient'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function disconnectFromStrava(memberId: string) {
  const db = createSupabaseServiceClient()
  try {
    const accessToken = await getServerStravaTokenService().getAccessToken(memberId)
    await deauthorize(fetch, accessToken)
  } catch (error) {
    console.warn('Không gọi được deauthorize của Strava, vẫn xoá dữ liệu cục bộ', error)
  }
  await disconnectLocally(db, memberId)
}
