import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { buildImageKey, canUploadPurpose, parseImageUploadRequest } from '@/lib/storage/imageUploadRules'
import { createUploadUrl, publicUrl } from '@/lib/storage/r2'

const UPLOAD_CONTENT_TYPE = 'image/jpeg'

export async function POST(request: Request) {
  const member = await getCurrentMember()
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const parsed = parseImageUploadRequest(await request.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 })
  const { purpose, bytes } = parsed.value
  if (!canUploadPurpose(purpose, member.role === 'bcn')) {
    return NextResponse.json({ error: 'Không có quyền tải ảnh này' }, { status: 403 })
  }

  const key = buildImageKey(purpose, randomUUID())
  const uploadUrl = await createUploadUrl({ key, contentType: UPLOAD_CONTENT_TYPE, contentLength: bytes })
  return NextResponse.json({ uploadUrl, imageUrl: publicUrl(key) })
}
