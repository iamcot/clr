import 'server-only'
import { MAX_ENTRIES_IN_LIST } from '@/config/challenges'
import { logAudit } from '@/lib/audit/logAudit'
import { loadChallenge } from '@/lib/challenges/loadChallenges'
import { recomputeChallenge } from '@/lib/challenges/recompute'
import { recomputeLevels } from '@/lib/stats/refreshStats'
import { settleChallenge, type SettleEntry, type SettlePlan } from '@/lib/challenges/settle'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export type SettlementPreview = {
  plan: SettlePlan
  names: Record<string, string>
  totalPenaltyAmount: number
  entryMemberIds: string[]
}

async function loadSettleEntries(
  challengeId: string,
): Promise<{ entries: SettleEntry[]; names: Record<string, string> }> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('challenge_entries')
    .select(
      'member_id, category_id, progress_pct, completed, rank, excluded, penalty_waived, members(display_name, member_type)',
    )
    .eq('challenge_id', challengeId)
    .range(0, MAX_ENTRIES_IN_LIST - 1)
  const rows = data ?? []
  return {
    entries: rows.map((row) => ({
      memberId: row.member_id,
      categoryId: row.category_id,
      memberType: row.members?.member_type ?? null,
      progressPct: Number(row.progress_pct),
      completed: row.completed,
      rank: row.rank,
      excluded: row.excluded,
      penaltyWaived: row.penalty_waived,
    })),
    names: Object.fromEntries(rows.map((row) => [row.member_id, row.members?.display_name ?? 'Thành viên'])),
  }
}

export async function previewSettlement(challengeId: string): Promise<SettlementPreview | null> {
  const data = await loadChallenge(challengeId)
  if (!data) return null
  const { entries, names } = await loadSettleEntries(challengeId)
  const plan = settleChallenge(entries, data.penaltyRule, data.rewardRule)
  const totalPenaltyAmount = plan.penalties.reduce((sum, penalty) => sum + penalty.amount, 0)
  return {
    plan,
    names,
    totalPenaltyAmount,
    entryMemberIds: entries.map((entry) => entry.memberId),
  }
}

export type CloseOutcome = { ok: true; penalties: number; rewards: number } | { ok: false; error: string }

// Chốt lại lần nữa không nhân đôi nhờ unique (member, nguồn, loại) và ignoreDuplicates
export async function closeChallengeAndSettle(challengeId: string): Promise<CloseOutcome> {
  const data = await loadChallenge(challengeId)
  if (!data) return { ok: false, error: 'Không tìm thấy challenge' }
  const { challenge } = data
  if (challenge.status !== 'finalizing' && challenge.status !== 'running') {
    return { ok: false, error: 'Challenge không ở trạng thái chốt được' }
  }
  if (new Date(challenge.ends_at).getTime() > Date.now()) return { ok: false, error: 'Challenge chưa kết thúc' }

  await recomputeChallenge(createSupabaseServiceClient(), challengeId)
  const preview = await previewSettlement(challengeId)
  if (!preview) return { ok: false, error: 'Không tính được thưởng phạt' }

  const supabase = await createSupabaseServerClient()
  const types = await supabase.from('penalty_types').select('id, code')
  const typeIdByCode = new Map((types.data ?? []).map((type) => [type.code, type.id]))
  const unknownType = preview.plan.penalties.find((penalty) => !typeIdByCode.has(penalty.typeCode))
  if (unknownType)
    return {
      ok: false,
      error: `Loại phạt không tồn tại: ${unknownType.typeCode}`,
    }

  const penaltyRows = preview.plan.penalties.map((penalty) => ({
    member_id: penalty.memberId,
    type_id: typeIdByCode.get(penalty.typeCode) ?? '',
    amount: penalty.amount,
    reason: `${challenge.title}: ${penalty.reason}`,
    source_type: 'challenge',
    source_id: challengeId,
  }))
  if (penaltyRows.length > 0) {
    const { error } = await supabase.from('penalties').upsert(penaltyRows, {
      onConflict: 'member_id,source_type,source_id,type_id',
      ignoreDuplicates: true,
    })
    if (error) return { ok: false, error: 'Không ghi được khoản phạt' }
  }

  const rewardRows = preview.plan.rewards.map((reward) => ({
    member_id: reward.memberId,
    title: `${challenge.title}: ${reward.title}`,
    amount: reward.amount,
    source_type: 'challenge',
    source_id: challengeId,
  }))
  if (rewardRows.length > 0) {
    const { error } = await supabase.from('rewards').upsert(rewardRows, {
      onConflict: 'member_id,source_type,source_id,title',
      ignoreDuplicates: true,
    })
    if (error) return { ok: false, error: 'Không ghi được khoản thưởng' }
  }

  const { error } = await supabase.from('challenges').update({ status: 'closed' }).eq('id', challengeId)
  if (error) return { ok: false, error: 'Không chuyển được trạng thái đã chốt' }

  await recomputeLevels(createSupabaseServiceClient(), [...new Set(preview.entryMemberIds)])
  await logAudit({
    action: 'close_challenge',
    targetTable: 'challenges',
    targetId: challengeId,
    after: { penalties: penaltyRows.length, rewards: rewardRows.length },
  })
  return {
    ok: true,
    penalties: penaltyRows.length,
    rewards: rewardRows.length,
  }
}
