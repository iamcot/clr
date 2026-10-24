import 'server-only'
import { recomputeChallenge } from '@/lib/challenges/recompute'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

export type AdvanceResult = { movedToFinalizing: number }

// Chuyển trạng thái theo thời gian; challenge vừa sang 'finalizing' được tính lại lần cuối
export async function advanceChallenges(db: ServiceClient): Promise<AdvanceResult> {
  const { data, error } = await db.rpc('advance_challenge_statuses')
  if (error) throw new Error(`Không chuyển được trạng thái challenge: ${error.message}`)
  const finalizingIds = data ?? []
  for (const challengeId of finalizingIds) await recomputeChallenge(db, challengeId)
  return { movedToFinalizing: finalizingIds.length }
}
