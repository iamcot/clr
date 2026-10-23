import { TOKEN_REFRESH_MARGIN_SECONDS } from '@/config/strava'
import { StravaNotConnectedError } from '@/lib/strava/errors'
import { TokenRequestError, type StravaTokenSet } from '@/lib/strava/oauth'

export type StoredTokens = StravaTokenSet

export type TokenStore = {
  read(memberId: string): Promise<StoredTokens | null>
  // Chỉ ghi khi refresh token trong DB vẫn là `expectedRefreshToken`; trả false nếu đã có tiến trình khác làm mới trước
  saveIfUnchanged(memberId: string, tokens: StravaTokenSet, expectedRefreshToken: string): Promise<boolean>
  markDisconnected(memberId: string): Promise<void>
}

export type TokenServiceDeps = {
  store: TokenStore
  refresh: (refreshToken: string) => Promise<StravaTokenSet>
  now: () => Date
}

const REVOKED_STATUSES = [400, 401]

function isFresh(tokens: StoredTokens, now: Date): boolean {
  return tokens.expiresAt.getTime() - now.getTime() > TOKEN_REFRESH_MARGIN_SECONDS * 1000
}

async function refreshTokens(deps: TokenServiceDeps, memberId: string, current: StoredTokens): Promise<string> {
  try {
    const renewed = await deps.refresh(current.refreshToken)
    const saved = await deps.store.saveIfUnchanged(memberId, renewed, current.refreshToken)
    if (saved) return renewed.accessToken

    const latest = await deps.store.read(memberId)
    return latest?.accessToken ?? renewed.accessToken
  } catch (error) {
    if (error instanceof TokenRequestError && REVOKED_STATUSES.includes(error.status)) {
      await deps.store.markDisconnected(memberId)
      throw new StravaNotConnectedError(memberId)
    }
    throw error
  }
}

export async function getValidAccessToken(
  deps: TokenServiceDeps,
  memberId: string,
  options: { forceRefresh?: boolean } = {},
): Promise<string> {
  const current = await deps.store.read(memberId)
  if (!current) throw new StravaNotConnectedError(memberId)
  if (!options.forceRefresh && isFresh(current, deps.now())) return current.accessToken
  return refreshTokens(deps, memberId, current)
}
