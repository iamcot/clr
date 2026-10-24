import 'server-only'
import { EVENT_LIST_LIMIT } from '@/config/events'
import { toEventView, type EventView } from '@/lib/events/loadEvents'
import { publicUrl } from '@/lib/storage/r2'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const PHOTO_LIST_LIMIT = 1000
const ALBUM_PREVIEW_PER_EVENT = 4

export type PhotoView = {
  id: string
  eventId: string
  thumbUrl: string
  fullUrl: string
  width: number
  height: number
  caption: string
  takenAt: string | null
  hidden: boolean
  uploadedByMe: boolean
  taggedMe: boolean
}

type PhotoRow = {
  id: string
  event_id: string
  object_key: string
  thumb_key: string
  width: number
  height: number
  caption: string
  taken_at: string | null
  created_at: string
  hidden: boolean
  uploaded_by: string | null
  event_photo_tags: { member_id: string }[]
}

const PHOTO_COLUMNS =
  'id, event_id, object_key, thumb_key, width, height, caption, taken_at, created_at, hidden, uploaded_by, event_photo_tags(member_id)'

function toPhotoView(row: PhotoRow, memberId: string): PhotoView {
  return {
    id: row.id,
    eventId: row.event_id,
    thumbUrl: publicUrl(row.thumb_key),
    fullUrl: publicUrl(row.object_key),
    width: row.width,
    height: row.height,
    caption: row.caption,
    takenAt: row.taken_at ?? row.created_at,
    hidden: row.hidden,
    uploadedByMe: row.uploaded_by === memberId,
    taggedMe: row.event_photo_tags.some((tag) => tag.member_id === memberId),
  }
}

// Thành viên thường chỉ thấy ảnh không ẩn (và ảnh ẩn của chính mình) nhờ RLS; BCN thấy tất cả
export async function loadEventPhotos(eventId: string, memberId: string): Promise<PhotoView[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('event_photos')
    .select(PHOTO_COLUMNS)
    .eq('event_id', eventId)
    .order('taken_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(PHOTO_LIST_LIMIT)
  return ((data ?? []) as PhotoRow[]).map((row) => toPhotoView(row, memberId))
}

export type AlbumEntry = { event: EventView; photoCount: number; previews: string[] }

export async function loadAlbumEntries(): Promise<AlbumEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data: counts } = await supabase.from('event_counts').select('event_id, photo_count').gt('photo_count', 0)
  const eventIds = (counts ?? []).flatMap((row) => (row.event_id ? [row.event_id] : []))
  if (eventIds.length === 0) return []

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('starts_at', { ascending: false })
    .limit(EVENT_LIST_LIMIT)
  const countById = new Map((counts ?? []).map((row) => [row.event_id, row.photo_count ?? 0]))

  return Promise.all(
    (events ?? []).map(async (row) => {
      const { data: previewRows } = await supabase
        .from('event_photos')
        .select('thumb_key')
        .eq('event_id', row.id)
        .eq('hidden', false)
        .order('created_at')
        .limit(ALBUM_PREVIEW_PER_EVENT)
      return {
        event: toEventView(row),
        photoCount: countById.get(row.id) ?? 0,
        previews: (previewRows ?? []).map((preview) => publicUrl(preview.thumb_key)),
      }
    }),
  )
}
