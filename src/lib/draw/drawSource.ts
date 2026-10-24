import 'server-only'
import type { DrawSourceType } from '@/config/draw'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

// Danh sách thành viên đủ điều kiện từ nguồn đã chọn; chỉ lấy người đang hoạt động
export async function listSourceMemberIds(
  db: ServiceClient,
  sourceType: DrawSourceType,
  sourceId: string | null,
): Promise<string[]> {
  if (sourceType === 'manual' || !sourceId) return []
  const rows =
    sourceType === 'challenge_completed'
      ? await db
          .from('challenge_entries')
          .select('member_id')
          .eq('challenge_id', sourceId)
          .eq('completed', true)
          .eq('excluded', false)
      : await db.from('event_attendees').select('member_id').eq('event_id', sourceId).not('checked_in_at', 'is', null)
  const memberIds = (rows.data ?? []).map((row) => row.member_id)
  if (memberIds.length === 0) return []

  const { data: active } = await db.from('members').select('id').in('id', memberIds).eq('status', 'active')
  return (active ?? []).map((member) => member.id)
}
