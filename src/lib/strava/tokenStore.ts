import 'server-only'
import { open, seal } from '@/lib/crypto/tokenBox'
import { getTokenEncKey } from '@/lib/strava/env'
import type { TokenStore } from '@/lib/strava/tokenService'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

export function createSupabaseTokenStore(
  db: ServiceClient,
  onRevoked: (memberId: string) => Promise<void>,
): TokenStore {
  const key = getTokenEncKey()

  async function readRow(memberId: string) {
    const { data, error } = await db
      .from('strava_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('member_id', memberId)
      .maybeSingle()
    if (error) throw new Error(`Không đọc được token: ${error.message}`)
    return data
  }

  return {
    async read(memberId) {
      const row = await readRow(memberId)
      if (!row) return null
      return {
        accessToken: open(row.access_token, key),
        refreshToken: open(row.refresh_token, key),
        expiresAt: new Date(row.expires_at),
      }
    },

    async saveIfUnchanged(memberId, tokens, expectedRefreshToken) {
      const current = await readRow(memberId)
      if (!current || open(current.refresh_token, key) !== expectedRefreshToken) return false

      const { data, error } = await db
        .from('strava_tokens')
        .update({
          access_token: seal(tokens.accessToken, key),
          refresh_token: seal(tokens.refreshToken, key),
          expires_at: tokens.expiresAt.toISOString(),
        })
        .eq('member_id', memberId)
        .eq('refresh_token', current.refresh_token)
        .select('member_id')
      if (error) throw new Error(`Không lưu được token: ${error.message}`)
      return data.length > 0
    },

    markDisconnected: onRevoked,
  }
}
