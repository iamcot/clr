'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DEFAULT_PARTICIPANT_WEIGHT, ONE_PRIZE_PER_MEMBER, REVEAL_DELAY_MS, SEED_BYTES } from '@/config/draw'
import { logAudit } from '@/lib/audit/logAudit'
import { requireBcn } from '@/lib/auth/requireBcn'
import { parseDrawInput } from '@/lib/draw/drawInput'
import { listSourceMemberIds } from '@/lib/draw/drawSource'
import { countPrizeSlots, pickWinners } from '@/lib/draw/pick'
import { deriveSeedNumber, generateSeed, sha256Hex } from '@/lib/draw/seed'
import { insertSystemPost } from '@/lib/posts/autoPosts'
import { isUuid } from '@/lib/storage/uploadRules'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { actionError, actionSuccess, type ActionResult } from '@/lib/toast/actionResult'
import { setFlashToast } from '@/lib/toast/setFlash'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

function refreshPages(drawId: string) {
  revalidatePath('/admin/draws')
  revalidatePath(`/admin/draws/${drawId}`)
  revalidatePath(`/draws/${drawId}`)
  revalidatePath('/draws')
}

function drawIdOf(formData: FormData): string {
  return String(formData.get('draw_id') ?? '')
}

async function loadDraw(db: ServiceClient, drawId: string) {
  if (!isUuid(drawId)) return null
  const { data } = await db.from('draws').select('*').eq('id', drawId).maybeSingle()
  return data
}

async function loadPlanInputs(db: ServiceClient, drawId: string) {
  const [prizes, participants] = await Promise.all([
    db.from('draw_prizes').select('id, name, quantity, sort').eq('draw_id', drawId),
    db.from('draw_participants').select('member_id, weight').eq('draw_id', drawId),
  ])
  return {
    prizes: prizes.data ?? [],
    participants: (participants.data ?? []).map((row) => ({ memberId: row.member_id, weight: row.weight })),
  }
}

export async function createDraw(formData: FormData): Promise<ActionResult | void> {
  const bcn = await requireBcn()
  const parsed = parseDrawInput(formData)
  if (!parsed.ok) return actionError(parsed.message)
  const { title, sourceType, sourceId, prizes } = parsed.value

  const db = createSupabaseServiceClient()
  const { data: draw, error } = await db
    .from('draws')
    .insert({ title, source_type: sourceType, source_id: sourceId, created_by: bcn.id })
    .select('id')
    .single()
  if (error || !draw) return actionError('Không tạo được đợt quay số, vui lòng thử lại')

  await db.from('draw_prizes').insert(prizes.map((prize, index) => ({ draw_id: draw.id, ...prize, sort: index + 1 })))
  const memberIds = await listSourceMemberIds(db, sourceType, sourceId)
  if (memberIds.length > 0) {
    await db
      .from('draw_participants')
      .insert(memberIds.map((memberId) => ({ draw_id: draw.id, member_id: memberId, weight: DEFAULT_PARTICIPANT_WEIGHT })))
  }
  await logAudit({ action: 'create_draw', targetTable: 'draws', targetId: draw.id, after: { title, sourceType } })
  await setFlashToast('draw_created')
  redirect(`/admin/draws/${draw.id}`)
}

export async function setParticipant(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const db = createSupabaseServiceClient()
  const draw = await loadDraw(db, drawIdOf(formData))
  if (!draw || draw.status !== 'draft' || draw.seed_commit) return actionError('Danh sách đã chốt, không sửa được')
  const memberId = String(formData.get('member_id') ?? '')
  if (!isUuid(memberId)) return actionError('Hãy chọn thành viên')

  const remove = formData.get('remove') === 'true'
  const { error } = remove
    ? await db.from('draw_participants').delete().eq('draw_id', draw.id).eq('member_id', memberId)
    : await db
        .from('draw_participants')
        .upsert({ draw_id: draw.id, member_id: memberId, weight: DEFAULT_PARTICIPANT_WEIGHT }, { ignoreDuplicates: true })
  if (error) return actionError('Không cập nhật được danh sách, vui lòng thử lại')
  refreshPages(draw.id)
  return actionSuccess(remove ? 'Đã bỏ khỏi danh sách' : 'Đã thêm vào danh sách')
}

// Chốt danh sách: sinh seed bí mật, công bố sha256(seed) để không ai (kể cả BCN) đổi kết quả về sau
export async function lockDraw(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const db = createSupabaseServiceClient()
  const draw = await loadDraw(db, drawIdOf(formData))
  if (!draw || draw.status !== 'draft' || draw.seed_commit) return actionError('Đợt quay số này đã chốt')

  const { prizes, participants } = await loadPlanInputs(db, draw.id)
  if (participants.length === 0) return actionError('Danh sách tham gia đang trống')
  if (ONE_PRIZE_PER_MEMBER && countPrizeSlots(prizes) > participants.length) {
    return actionError('Số giải nhiều hơn số người tham gia')
  }

  const seed = generateSeed(SEED_BYTES)
  const { error: secretError } = await db.from('draw_secrets').upsert({ draw_id: draw.id, seed })
  if (secretError) return actionError('Không lưu được mã bí mật, vui lòng thử lại')
  const { error } = await db.from('draws').update({ seed_commit: await sha256Hex(seed) }).eq('id', draw.id)
  if (error) return actionError('Không chốt được danh sách, vui lòng thử lại')

  await logAudit({ action: 'lock_draw', targetTable: 'draws', targetId: draw.id, after: { by: bcn.id } })
  refreshPages(draw.id)
  return actionSuccess('Đã chốt danh sách và công bố mã commit')
}

export async function startDraw(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const db = createSupabaseServiceClient()
  const draw = await loadDraw(db, drawIdOf(formData))
  if (!draw || draw.status !== 'draft' || !draw.seed_commit) return actionError('Hãy chốt danh sách trước khi bắt đầu')
  const { error } = await db.from('draws').update({ status: 'live', started_at: new Date().toISOString() }).eq('id', draw.id)
  if (error) return actionError('Không bắt đầu được, vui lòng thử lại')
  refreshPages(draw.id)
  return actionSuccess('Đã bắt đầu quay số')
}

async function computeAllPicks(db: ServiceClient, drawId: string) {
  const { data: secret } = await db.from('draw_secrets').select('seed').eq('draw_id', drawId).maybeSingle()
  if (!secret) return null
  const { prizes, participants } = await loadPlanInputs(db, drawId)
  return pickWinners(participants, prizes, await deriveSeedNumber(secret.seed), ONE_PRIZE_PER_MEMBER)
}

// Người trúng đã được định sẵn bởi seed; bước này chỉ công bố lần lượt và hẹn giờ cho mọi máy dừng cùng lúc
export async function drawNext(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const db = createSupabaseServiceClient()
  const draw = await loadDraw(db, drawIdOf(formData))
  if (!draw || draw.status !== 'live') return actionError('Đợt quay số không ở trạng thái đang quay')

  const { data: done } = await db.from('draw_results').select('draw_order, reveal_at').eq('draw_id', draw.id)
  const results = done ?? []
  if (results.some((result) => Date.parse(result.reveal_at) > Date.now())) return actionError('Đang quay giải trước, hãy đợi')

  const next = (await computeAllPicks(db, draw.id))?.[results.length]
  if (!next) return actionError('Đã quay hết các giải')
  const { error } = await db.from('draw_results').insert({
    draw_id: draw.id,
    draw_order: next.order,
    prize_id: next.prizeId,
    member_id: next.memberId,
    reveal_at: new Date(Date.now() + REVEAL_DELAY_MS).toISOString(),
  })
  if (error) return actionError('Không quay được, vui lòng thử lại')
  refreshPages(draw.id)
  return actionSuccess('Đang quay…')
}

// Quay xong: lộ seed, ghi thưởng cho người trúng và đăng bài kết quả
export async function finishDraw(formData: FormData): Promise<ActionResult> {
  const bcn = await requireBcn()
  const db = createSupabaseServiceClient()
  const draw = await loadDraw(db, drawIdOf(formData))
  if (!draw || draw.status !== 'live') return actionError('Đợt quay số không ở trạng thái đang quay')

  const picks = await computeAllPicks(db, draw.id)
  const { data: resultRows } = await db
    .from('draw_results')
    .select('draw_order, prize_id, member_id, reveal_at')
    .eq('draw_id', draw.id)
    .order('draw_order')
  const results = resultRows ?? []
  if (!picks || results.length < picks.length) return actionError('Chưa quay hết các giải')
  if (results.some((result) => Date.parse(result.reveal_at) > Date.now())) return actionError('Giải cuối đang quay, hãy đợi')

  const { data: secret } = await db.from('draw_secrets').select('seed').eq('draw_id', draw.id).maybeSingle()
  if (!secret) return actionError('Không đọc được mã bí mật')
  const { error } = await db
    .from('draws')
    .update({ status: 'done', seed_reveal: secret.seed, finished_at: new Date().toISOString() })
    .eq('id', draw.id)
  if (error) return actionError('Không kết thúc được, vui lòng thử lại')

  await grantPrizeRewards(db, draw.id, draw.title, bcn.id)
  await publishResultPost(db, draw.id, draw.title)
  await logAudit({ action: 'finish_draw', targetTable: 'draws', targetId: draw.id })
  refreshPages(draw.id)
  return actionSuccess('Đã công bố kết quả')
}

async function grantPrizeRewards(db: ServiceClient, drawId: string, drawTitle: string, createdBy: string) {
  const [{ data: results }, { data: prizes }] = await Promise.all([
    db.from('draw_results').select('member_id, prize_id').eq('draw_id', drawId),
    db.from('draw_prizes').select('id, name').eq('draw_id', drawId),
  ])
  const prizeName = new Map((prizes ?? []).map((prize) => [prize.id, prize.name]))
  const rows = (results ?? []).map((result) => ({
    member_id: result.member_id,
    title: `${drawTitle}: ${prizeName.get(result.prize_id) ?? ''}`,
    item: prizeName.get(result.prize_id) ?? null,
    source_type: 'draw',
    source_id: drawId,
    created_by: createdBy,
  }))
  if (rows.length === 0) return
  await db.from('rewards').upsert(rows, { onConflict: 'member_id,source_type,source_id,title', ignoreDuplicates: true })
}

async function publishResultPost(db: ServiceClient, drawId: string, drawTitle: string) {
  const { data: results } = await db.from('draw_results').select('draw_order, member_id, prize_id').eq('draw_id', drawId).order('draw_order')
  const [{ data: prizes }, { data: members }] = await Promise.all([
    db.from('draw_prizes').select('id, name').eq('draw_id', drawId),
    db.from('members').select('id, display_name').in('id', (results ?? []).map((result) => result.member_id)),
  ])
  const prizeName = new Map((prizes ?? []).map((prize) => [prize.id, prize.name]))
  const memberName = new Map((members ?? []).map((member) => [member.id, member.display_name ?? 'Thành viên']))
  const lines = (results ?? []).map(
    (result) => `- **${prizeName.get(result.prize_id) ?? ''}**: ${memberName.get(result.member_id) ?? ''}`,
  )
  await insertSystemPost(
    db,
    `draw:${drawId}`,
    'result',
    {
      title: `Kết quả quay số: ${drawTitle}`,
      bodyMd: `${lines.join('\n')}\n\nXem lại và tự kiểm tra kết quả tại [trang quay số](/draws/${drawId}).`,
    },
    new Date(),
  )
}

export async function cancelDraw(formData: FormData): Promise<ActionResult> {
  await requireBcn()
  const reason = String(formData.get('reason') ?? '').trim()
  if (!reason) return actionError('Hãy nhập lý do huỷ')
  const db = createSupabaseServiceClient()
  const draw = await loadDraw(db, drawIdOf(formData))
  if (!draw || draw.status === 'done' || draw.status === 'cancelled') return actionError('Không huỷ được đợt quay số này')

  const { error } = await db
    .from('draws')
    .update({ status: 'cancelled', cancel_reason: reason, finished_at: new Date().toISOString() })
    .eq('id', draw.id)
  if (error) return actionError('Không huỷ được, vui lòng thử lại')
  await logAudit({ action: 'cancel_draw', targetTable: 'draws', targetId: draw.id, after: { reason } })
  refreshPages(draw.id)
  return actionSuccess('Đã huỷ đợt quay số')
}
