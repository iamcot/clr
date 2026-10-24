import 'server-only'
import { DRAW_STYLES, type DrawSourceType, type DrawStatus, type DrawStyle } from '@/config/draw'
import { isWinnerRevealable } from '@/lib/draw/stage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export type DrawSummary = { id: string; title: string; status: DrawStatus; createdAt: string }

export type DrawDetail = {
  id: string
  title: string
  status: DrawStatus
  style: DrawStyle
  sourceType: DrawSourceType
  sourceId: string | null
  seedCommit: string | null
  seedReveal: string | null
  cancelReason: string | null
  prizes: { id: string; name: string; quantity: number; sort: number }[]
  participants: { memberId: string; name: string; weight: number }[]
  results: { order: number; prizeId: string; prizeName: string; memberId: string; memberName: string; revealAt: number }[]
}

export async function loadDrawList(): Promise<DrawSummary[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('draws').select('id, title, status, created_at').order('created_at', { ascending: false })
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status as DrawStatus,
    createdAt: row.created_at,
  }))
}

async function loadMemberNames(memberIds: string[]): Promise<Map<string, string>> {
  if (memberIds.length === 0) return new Map()
  const supabase = await createSupabaseServerClient()
  // View riêng của quay số: tên thật của người tham gia, người chưa được duyệt cũng đọc được
  const { data } = await supabase.from('draw_members').select('id, display_name').in('id', memberIds)
  return new Map((data ?? []).flatMap((member) => (member.id ? [[member.id, member.display_name ?? 'Thành viên'] as const] : [])))
}

export async function loadDrawDetail(drawId: string): Promise<DrawDetail | null> {
  const supabase = await createSupabaseServerClient()
  const [draw, prizes, participants, results] = await Promise.all([
    supabase.from('draws').select('*').eq('id', drawId).maybeSingle(),
    supabase.from('draw_prizes').select('id, name, quantity, sort').eq('draw_id', drawId).order('sort'),
    supabase.from('draw_participants').select('member_id, weight').eq('draw_id', drawId),
    supabase.from('draw_results').select('draw_order, prize_id, member_id, reveal_at').eq('draw_id', drawId).order('draw_order'),
  ])
  const drawRow = draw.data
  if (!drawRow) return null

  const prizeList = prizes.data ?? []
  const participantRows = participants.data ?? []
  const resultRows = results.data ?? []
  const names = await loadMemberNames([...new Set([...participantRows, ...resultRows].map((row) => row.member_id))])
  const prizeName = new Map(prizeList.map((prize) => [prize.id, prize.name]))

  return {
    id: drawRow.id,
    title: drawRow.title,
    status: drawRow.status as DrawStatus,
    style: DRAW_STYLES.find((item) => item === drawRow.style) ?? 'reel',
    sourceType: drawRow.source_type as DrawSourceType,
    sourceId: drawRow.source_id,
    seedCommit: drawRow.seed_commit,
    seedReveal: drawRow.seed_reveal,
    cancelReason: drawRow.cancel_reason,
    prizes: prizeList,
    participants: participantRows
      .map((row) => ({ memberId: row.member_id, name: names.get(row.member_id) ?? 'Thành viên', weight: row.weight }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    results: resultRows.map((row) => ({
      order: row.draw_order,
      prizeId: row.prize_id,
      prizeName: prizeName.get(row.prize_id) ?? '',
      memberId: row.member_id,
      memberName: names.get(row.member_id) ?? 'Thành viên',
      revealAt: Date.parse(row.reveal_at),
    })),
  }
}

export type CompletedResult = {
  order: number
  prizeId: string
  prizeName: string
  memberId: string
  memberName: string
}

export type SpinningView = {
  order: number
  prizeName: string
  startedAtMs: number
  revealAtMs: number
  // Chỉ có trong WINNER_REVEAL_LEAD_MS cuối; trước đó server giữ kín người trúng
  winner: { memberId: string; name: string } | null
}

export type DrawState = {
  status: DrawStatus
  style: DrawStyle
  completed: CompletedResult[]
  spinning: SpinningView | null
  serverNowMs: number
}

export async function canViewDraw(drawId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('draws').select('id').eq('id', drawId).maybeSingle()
  return data !== null
}

// Đọc bằng service role vì người trúng chưa tới reveal_at bị RLS chặn; người gọi phải kiểm quyền xem trước (canViewDraw)
export async function loadDrawState(drawId: string): Promise<DrawState | null> {
  const db = createSupabaseServiceClient()
  const [draw, prizes, results] = await Promise.all([
    db.from('draws').select('status, style').eq('id', drawId).maybeSingle(),
    db.from('draw_prizes').select('id, name').eq('draw_id', drawId),
    db.from('draw_results').select('draw_order, prize_id, member_id, drawn_at, reveal_at').eq('draw_id', drawId).order('draw_order'),
  ])
  const drawRow = draw.data
  if (!drawRow) return null
  const rows = results.data ?? []
  const { data: members } = await db.from('members').select('id, display_name').in('id', rows.map((row) => row.member_id))
  const names = new Map((members ?? []).map((member) => [member.id, member.display_name ?? 'Thành viên']))
  const prizeName = new Map((prizes.data ?? []).map((prize) => [prize.id, prize.name]))
  const serverNowMs = Date.now()

  const completed = rows
    .filter((row) => Date.parse(row.reveal_at) <= serverNowMs)
    .map((row) => ({
      order: row.draw_order,
      prizeId: row.prize_id,
      prizeName: prizeName.get(row.prize_id) ?? '',
      memberId: row.member_id,
      memberName: names.get(row.member_id) ?? 'Thành viên',
    }))
  const inFlight = rows.find((row) => Date.parse(row.reveal_at) > serverNowMs)
  const spinning = inFlight
    ? {
        order: inFlight.draw_order,
        prizeName: prizeName.get(inFlight.prize_id) ?? '',
        startedAtMs: Date.parse(inFlight.drawn_at),
        revealAtMs: Date.parse(inFlight.reveal_at),
        winner: isWinnerRevealable(serverNowMs, Date.parse(inFlight.reveal_at))
          ? { memberId: inFlight.member_id, name: names.get(inFlight.member_id) ?? 'Thành viên' }
          : null,
      }
    : null

  return {
    status: drawRow.status as DrawStatus,
    style: DRAW_STYLES.find((item) => item === drawRow.style) ?? 'reel',
    completed,
    spinning,
    serverNowMs,
  }
}
