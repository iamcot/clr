import { NextResponse } from 'next/server'
import { MAX_PHOTO_BYTES, MAX_THUMB_BYTES } from '@/config/uploads'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { deleteObject, publicUrl, readObjectInfo } from '@/lib/storage/r2'
import { buildPhotoKeys, hasJpegHeader, parsePhotoCompleteRequest } from '@/lib/storage/uploadRules'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type StoredObject = { bytes: number; head: Uint8Array } | null

function isValidJpeg(object: StoredObject, maxBytes: number): object is NonNullable<StoredObject> {
  return object !== null && object.bytes > 0 && object.bytes <= maxBytes && hasJpegHeader(object.head)
}

export async function POST(request: Request) {
  const member = await getCurrentMember()
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const parsed = parsePhotoCompleteRequest(await request.json().catch(() => null))
  if (!parsed) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 400 })

  const keys = buildPhotoKeys(parsed.eventId, parsed.photoId)
  const [photo, thumb] = await Promise.all([readObjectInfo(keys.objectKey), readObjectInfo(keys.thumbKey)])
  if (!isValidJpeg(photo, MAX_PHOTO_BYTES) || !isValidJpeg(thumb, MAX_THUMB_BYTES)) {
    await Promise.all([deleteObject(keys.objectKey), deleteObject(keys.thumbKey)])
    return NextResponse.json({ error: 'File tải lên không phải ảnh JPEG hợp lệ' }, { status: 422 })
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('event_photos').insert({
    id: parsed.photoId,
    event_id: parsed.eventId,
    uploaded_by: member.id,
    object_key: keys.objectKey,
    thumb_key: keys.thumbKey,
    width: parsed.width,
    height: parsed.height,
    bytes: photo.bytes,
    taken_at: parsed.takenAt,
  })
  if (error) {
    await Promise.all([deleteObject(keys.objectKey), deleteObject(keys.thumbKey)])
    return NextResponse.json({ error: 'Không lưu được ảnh' }, { status: 403 })
  }
  return NextResponse.json({ photoId: parsed.photoId, thumbUrl: publicUrl(keys.thumbKey) })
}
