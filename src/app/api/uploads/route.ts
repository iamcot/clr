import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { createUploadUrl } from '@/lib/storage/r2'
import { buildPhotoKeys, parsePhotoUploadRequest } from '@/lib/storage/uploadRules'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const UPLOAD_CONTENT_TYPE = 'image/jpeg'

export async function POST(request: Request) {
  const member = await getCurrentMember()
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const parsed = parsePhotoUploadRequest(await request.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 })
  const { eventId, photoBytes, thumbBytes } = parsed.value

  const supabase = await createSupabaseServerClient()
  const { data: event } = await supabase.from('events').select('id').eq('id', eventId).neq('status', 'draft').maybeSingle()
  if (!event) return NextResponse.json({ error: 'Không tìm thấy event' }, { status: 404 })

  const photoId = randomUUID()
  const keys = buildPhotoKeys(eventId, photoId)
  const [photoUploadUrl, thumbUploadUrl] = await Promise.all([
    createUploadUrl({ key: keys.objectKey, contentType: UPLOAD_CONTENT_TYPE, contentLength: photoBytes }),
    createUploadUrl({ key: keys.thumbKey, contentType: UPLOAD_CONTENT_TYPE, contentLength: thumbBytes }),
  ])
  return NextResponse.json({ photoId, photoUploadUrl, thumbUploadUrl })
}
