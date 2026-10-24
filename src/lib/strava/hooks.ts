import 'server-only'
import { recomputeChallengesForMember } from '@/lib/challenges/recompute'
import { refreshMemberStatsAndLevel } from '@/lib/stats/refreshStats'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

async function runSafely(label: string, memberId: string, task: () => Promise<void>) {
  try {
    await task()
  } catch (error) {
    console.error(`Không cập nhật được ${label} sau khi hoạt động đổi`, memberId, error)
  }
}

// Điểm móc sau khi hoạt động của thành viên thay đổi. Lỗi ở đây không làm hỏng đồng bộ:
// job đêm (thống kê) và job chốt kỳ (challenge) sẽ tính lại.
export async function onActivitiesChanged(memberId: string): Promise<void> {
  const db = createSupabaseServiceClient()
  await runSafely('thống kê', memberId, () => refreshMemberStatsAndLevel(db, memberId))
  await runSafely('challenge', memberId, () => recomputeChallengesForMember(db, memberId))
}
