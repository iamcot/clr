import 'server-only'
import type { DrawSourceType, DrawStatus } from '@/config/draw'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type DrawSummary = { id: string; title: string; status: DrawStatus; createdAt: string }

export type DrawDetail = {
  id: string
  title: string
  status: DrawStatus
  sourceType: DrawSourceType
  sourceId: string | null
  seedCommit: string | null
  seedReveal: string | null
  cancelReason: string | null
  prizes: { id: string; name: string; quantity: number; sort: number }[]
  participants: { memberId: string; name: string; weight: number }[]
  results: { order: number; prizeId: string; prizeName: string; memberId: string; memberName: string; revealAt: number }[]
  serverNowMs: number
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
  const { data } = await supabase.from('members_public').select('id, display_name').in('id', memberIds)
  return new Map((data ?? []).map((member) => [member.id, member.display_name ?? 'Thành viên']))
}

export async function loadDrawDetail(drawId: string): Promise<DrawDetail | null> {
  const supabase = await createSupabaseServerClient()
  const [draw, prizes, participants, results] = await Promise.all([
    supabase.from('draws').select('*').eq('id', drawId).maybeSingle(),
    supabase.from('draw_prizes').select('id, name, quantity, sort').eq('draw_id', drawId).order('sort'),
    supabase.from('draw_participants').select('member_id, weight').eq('draw_id', drawId),
    supabase.from('draw_results').select('draw_order, prize_id, member_id, reveal_at').eq('draw_id', drawId).order('draw_order'),
  ])
  if (!draw.data) return null

  const prizeList = prizes.data ?? []
  const participantRows = participants.data ?? []
  const resultRows = results.data ?? []
  const names = await loadMemberNames([...new Set([...participantRows, ...resultRows].map((row) => row.member_id))])
  const prizeName = new Map(prizeList.map((prize) => [prize.id, prize.name]))

  return {
    id: draw.data.id,
    title: draw.data.title,
    status: draw.data.status as DrawStatus,
    sourceType: draw.data.source_type as DrawSourceType,
    sourceId: draw.data.source_id,
    seedCommit: draw.data.seed_commit,
    seedReveal: draw.data.seed_reveal,
    cancelReason: draw.data.cancel_reason,
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
    serverNowMs: Date.now(),
  }
}
