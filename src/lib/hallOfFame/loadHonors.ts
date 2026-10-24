import 'server-only'
import { HONORS_LIMIT, HONOR_KINDS, type HonorKind } from '@/config/hallOfFame'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type HonorView = {
  id: string
  memberId: string
  memberName: string
  avatarUrl: string | null
  kind: HonorKind
  title: string
  detail: string
  date: string
  imageUrl: string | null
  approved: boolean
  raceResultId: string | null
  challengeId: string | null
}

type HonorFilter = { approvedOnly: boolean; memberId?: string }

const HONOR_COLUMNS =
  'id, member_id, kind, title, detail, honor_date, image_url, approved, race_result_id, challenge_id'

export async function loadHonors({ approvedOnly, memberId }: HonorFilter): Promise<HonorView[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase.from('honors').select(HONOR_COLUMNS).order('honor_date', { ascending: false }).limit(HONORS_LIMIT)
  if (approvedOnly) query = query.eq('approved', true)
  if (memberId) query = query.eq('member_id', memberId)
  const { data: rows } = await query
  if (!rows || rows.length === 0) return []

  // Bảng vàng công khai nên đọc tên từ view riêng, người chưa được duyệt cũng không bị che
  const { data: members } = await supabase
    .from(approvedOnly ? 'hall_of_fame_members' : 'members_public')
    .select('id, display_name, avatar_url')
    .in(
      'id',
      [...new Set(rows.map((row) => row.member_id))],
    )
  const memberById = new Map((members ?? []).flatMap((member) => (member.id ? [[member.id, member] as const] : [])))

  return rows.flatMap((row) => {
    const kind = HONOR_KINDS.find((item) => item === row.kind)
    if (!kind) return []
    const member = memberById.get(row.member_id)
    return [
      {
        id: row.id,
        memberId: row.member_id,
        memberName: member?.display_name ?? 'Thành viên',
        avatarUrl: member?.avatar_url ?? null,
        kind,
        title: row.title,
        detail: row.detail,
        date: row.honor_date,
        imageUrl: row.image_url,
        approved: row.approved,
        raceResultId: row.race_result_id,
        challengeId: row.challenge_id,
      },
    ]
  })
}
