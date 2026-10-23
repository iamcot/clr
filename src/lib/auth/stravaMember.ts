import 'server-only'
import { seal } from '@/lib/crypto/tokenBox'
import { getTokenEncKey } from '@/lib/strava/env'
import type { StravaAthlete, StravaAuthResult } from '@/lib/strava/oauth'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/lib/types/database'

type MemberRow = Database['public']['Tables']['members']['Row']
type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

export type StravaMember = Pick<MemberRow, 'id' | 'status'> & { email: string }

export function stravaEmail(athleteId: number): string {
  return `strava_${athleteId}@users.clr.local`
}

function buildDisplayName(athlete: StravaAthlete): string | null {
  const name = [athlete.firstname, athlete.lastname].filter(Boolean).join(' ')
  return name || null
}

async function createMember(db: ServiceClient, athlete: StravaAthlete): Promise<MemberRow['id']> {
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: stravaEmail(athlete.id),
    email_confirm: true,
    user_metadata: { strava_athlete_id: athlete.id },
  })
  if (createError || !created.user) throw new Error(`Không tạo được user: ${createError?.message}`)

  const { error: insertError } = await db.from('members').insert({
    id: created.user.id,
    strava_athlete_id: athlete.id,
    display_name: buildDisplayName(athlete),
    avatar_url: athlete.profile,
    gender: athlete.sex,
  })
  if (insertError) {
    await db.auth.admin.deleteUser(created.user.id)
    throw new Error(`Không tạo được hồ sơ thành viên: ${insertError.message}`)
  }
  return created.user.id
}

async function findMember(db: ServiceClient, athleteId: number) {
  const { data, error } = await db
    .from('members')
    .select('id, status')
    .eq('strava_athlete_id', athleteId)
    .maybeSingle()
  if (error) throw new Error(`Không đọc được thành viên: ${error.message}`)
  return data
}

async function refreshProfile(db: ServiceClient, memberId: string, athlete: StravaAthlete) {
  const { error } = await db
    .from('members')
    .update({ avatar_url: athlete.profile, strava_connected: true })
    .eq('id', memberId)
  if (error) throw new Error(`Không cập nhật được hồ sơ: ${error.message}`)
}

async function saveTokens(db: ServiceClient, memberId: string, auth: StravaAuthResult, scope: string) {
  const key = getTokenEncKey()
  const { error } = await db.from('strava_tokens').upsert({
    member_id: memberId,
    access_token: seal(auth.accessToken, key),
    refresh_token: seal(auth.refreshToken, key),
    expires_at: auth.expiresAt.toISOString(),
    scope,
  })
  if (error) throw new Error(`Không lưu được token: ${error.message}`)
}

export async function upsertMemberFromStrava(auth: StravaAuthResult, scope: string): Promise<StravaMember> {
  const db = createSupabaseServiceClient()
  const existing = await findMember(db, auth.athlete.id)

  if (existing) await refreshProfile(db, existing.id, auth.athlete)
  const memberId = existing?.id ?? (await createMember(db, auth.athlete))

  await saveTokens(db, memberId, auth, scope)
  return { id: memberId, status: existing?.status ?? 'pending', email: stravaEmail(auth.athlete.id) }
}
