import 'server-only'
import { refreshMemberStatsAndLevel } from '@/lib/stats/refreshStats'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// Điểm móc sau khi hoạt động của thành viên thay đổi; task 7 (challenge) sẽ thêm việc vào đây.
// Lỗi tổng hợp không làm hỏng đồng bộ: job đêm sẽ tính lại.
export async function onActivitiesChanged(memberId: string): Promise<void> {
  try {
    await refreshMemberStatsAndLevel(createSupabaseServiceClient(), memberId)
  } catch (error) {
    console.error('Không cập nhật được thống kê sau khi hoạt động đổi', memberId, error)
  }
}
