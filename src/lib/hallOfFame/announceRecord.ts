import 'server-only'
import { RECORD_DISTANCES } from '@/config/hallOfFame'
import { loadVerifiedRecordResults } from '@/lib/hallOfFame/loadRecords'
import { checkNewClubRecord, classifyDistance, listRecordHolders, type RecordCheck, type RecordResult } from '@/lib/hallOfFame/records'
import { insertSystemPost } from '@/lib/posts/autoPosts'
import { formatDuration } from '@/lib/stats/format'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export type AnnounceOutcome = RecordCheck | 'posted' | 'already_posted'

function recordPostKey(resultId: string): string {
  return `club-record:${resultId}`
}

async function postRecord(record: RecordResult): Promise<boolean> {
  const distanceKey = classifyDistance(record.distanceMeters)
  const distanceLabel = RECORD_DISTANCES.find((distance) => distance.key === distanceKey)?.label ?? ''
  return insertSystemPost(
    createSupabaseServiceClient(),
    recordPostKey(record.id),
    'system',
    {
      title: `Kỷ lục CLB mới: ${record.displayName} · ${distanceLabel}`,
      bodyMd: `Chúc mừng **${record.displayName}** đã phá kỷ lục CLB cự ly ${distanceLabel} với thời gian **${formatDuration(record.chipTimeSeconds)}** tại ${record.raceName}.`,
    },
    new Date(),
  )
}

// Gọi sau khi BCN xác minh một kết quả; kỷ lục mới thì tạo bài chúc mừng (chống trùng bằng source_key)
export async function announceClubRecordIfNew(resultId: string): Promise<AnnounceOutcome> {
  const results = await loadVerifiedRecordResults(await createSupabaseServerClient())
  const check = checkNewClubRecord(results, resultId)
  if (check !== 'record') return check
  const record = results.find((result) => result.id === resultId)
  if (!record) return 'result_missing'
  return (await postRecord(record)) ? 'posted' : 'already_posted'
}

// Đăng bài cho các kỷ lục đang đứng đầu mà chưa có bài (kết quả xác minh từ trước khi có tính năng); trả về số bài mới
export async function announceCurrentRecords(): Promise<number> {
  const results = await loadVerifiedRecordResults(await createSupabaseServerClient())
  let created = 0
  for (const holder of listRecordHolders(results)) {
    if (await postRecord(holder)) created += 1
  }
  return created
}
