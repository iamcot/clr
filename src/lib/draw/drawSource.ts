import 'server-only'
import type { DrawSourceType } from '@/config/draw'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

// Danh sách thành viên đủ điều kiện từ nguồn đã chọn; chỉ lấy người đang hoạt động
export async function listSourceMemberIds(
  db: ServiceClient,
  sourceType: DrawSourceType,
  sourceIds: string[],
): Promise<string[]> {
  if (sourceType === 'manual' || sourceIds.length === 0) return []
  const rows =
    sourceType === 'challenge_completed'
      ? await db
          .from('challenge_entries')
          .select('member_id')
          .in('challenge_id', sourceIds)
          .eq('completed', true)
          .eq('excluded', false)
      : await db.from('event_attendees').select('member_id').in('event_id', sourceIds).not('checked_in_at', 'is', null)
  const memberIds = [...new Set((rows.data ?? []).map((row) => row.member_id))]
  if (memberIds.length === 0) return []

  const { data: active } = await db.from('members').select('id').in('id', memberIds).eq('status', 'active')
  return (active ?? []).map((member) => member.id)
}
