import 'server-only'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

function throwOnError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`)
}

// Xoá hoạt động (kéo theo best efforts) và dừng kéo lịch sử để dữ liệu không tự quay lại
export async function removeStravaData(db: ServiceClient, memberId: string) {
  const activities = await db.from('activities').delete().eq('member_id', memberId)
  throwOnError(activities.error, 'Không xoá được hoạt động')
  const job = await db.from('backfill_jobs').update({ status: 'done' }).eq('member_id', memberId)
  throwOnError(job.error, 'Không dừng được job kéo lịch sử')
  const stats = await db.from('member_stats_period').delete().eq('member_id', memberId)
  throwOnError(stats.error, 'Không xoá được thống kê')
  const level = await db.from('members').update({ level: 1, club_points: 0 }).eq('id', memberId)
  throwOnError(level.error, 'Không đặt lại level')
}

// Điều khoản Strava: người dùng thu hồi quyền thì phải xoá dữ liệu đã lấy về
export async function disconnectLocally(db: ServiceClient, memberId: string) {
  const tokens = await db.from('strava_tokens').delete().eq('member_id', memberId)
  throwOnError(tokens.error, 'Không xoá được token')
  const member = await db.from('members').update({ strava_connected: false }).eq('id', memberId)
  throwOnError(member.error, 'Không cập nhật được trạng thái kết nối')
  await removeStravaData(db, memberId)
  const job = await db.from('backfill_jobs').delete().eq('member_id', memberId)
  throwOnError(job.error, 'Không xoá được job kéo lịch sử')
}
