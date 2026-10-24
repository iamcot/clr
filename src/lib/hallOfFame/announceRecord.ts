import 'server-only'
import { RECORD_DISTANCES } from '@/config/hallOfFame'
import { classifyDistance, isNewClubRecord } from '@/lib/hallOfFame/records'
import { loadVerifiedRecordResults } from '@/lib/hallOfFame/loadRecords'
import { insertSystemPost } from '@/lib/posts/autoPosts'
import { formatDuration } from '@/lib/stats/format'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// Gọi sau khi BCN xác minh một kết quả; kỷ lục mới thì tạo bài chúc mừng (chống trùng bằng source_key)
export async function announceClubRecordIfNew(resultId: string): Promise<void> {
  const results = await loadVerifiedRecordResults(await createSupabaseServerClient())
  if (!isNewClubRecord(results, resultId)) return
  const record = results.find((result) => result.id === resultId)
  if (!record) return
  const distanceKey = classifyDistance(record.distanceMeters)
  const distanceLabel = RECORD_DISTANCES.find((distance) => distance.key === distanceKey)?.label ?? ''

  await insertSystemPost(
    createSupabaseServiceClient(),
    `club-record:${resultId}`,
    'system',
    {
      title: `Kỷ lục CLB mới: ${record.displayName} · ${distanceLabel}`,
      bodyMd: `Chúc mừng **${record.displayName}** đã phá kỷ lục CLB cự ly ${distanceLabel} với thời gian **${formatDuration(record.chipTimeSeconds)}** tại ${record.raceName}.`,
    },
    new Date(),
  )
}
