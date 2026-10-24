import 'server-only'
import { onActivitiesChanged } from '@/lib/strava/hooks'
import { mapActivity, mapBestEfforts, type StravaActivityJson } from '@/lib/strava/mapActivity'
import { passesActivityRules } from '@/lib/strava/validity'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>

function throwOnError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`)
}

async function replaceBestEfforts(db: ServiceClient, activityId: number, json: StravaActivityJson) {
  const removed = await db.from('activity_best_efforts').delete().eq('activity_id', activityId)
  throwOnError(removed.error, 'Không xoá được best efforts cũ')

  const efforts = mapBestEfforts(activityId, json)
  if (efforts.length === 0) return
  const inserted = await db.from('activity_best_efforts').insert(efforts)
  throwOnError(inserted.error, 'Không lưu được best efforts')
}

// Bản chi tiết từ GET /activities/{id}: ghi đè bản tóm tắt và lưu best efforts
export async function saveActivityDetail(db: ServiceClient, memberId: string, json: StravaActivityJson) {
  const mapped = mapActivity(memberId, json, { detailFetched: true })
  const row = { ...mapped, passes_rules: passesActivityRules(mapped) }

  const upserted = await db.from('activities').upsert(row)
  throwOnError(upserted.error, 'Không lưu được hoạt động')
  await replaceBestEfforts(db, row.id, json)
  await onActivitiesChanged(memberId)
}

// Bản tóm tắt từ danh sách: không đè lên hoạt động đã có (có thể đã có bản chi tiết)
export async function saveActivitySummaries(db: ServiceClient, memberId: string, items: StravaActivityJson[]) {
  const rows = items.map((json) => {
    const mapped = mapActivity(memberId, json, { detailFetched: false })
    return { ...mapped, passes_rules: passesActivityRules(mapped) }
  })
  if (rows.length === 0) return

  const inserted = await db.from('activities').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  throwOnError(inserted.error, 'Không lưu được bản tóm tắt hoạt động')
  await onActivitiesChanged(memberId)
}

export async function deleteActivity(db: ServiceClient, memberId: string, activityId: number) {
  const removed = await db.from('activities').delete().eq('id', activityId).eq('member_id', memberId)
  throwOnError(removed.error, 'Không xoá được hoạt động')
  await onActivitiesChanged(memberId)
}
