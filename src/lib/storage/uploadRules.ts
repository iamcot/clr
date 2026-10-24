import {
  JPEG_MAGIC,
  MAX_PHOTO_BYTES,
  MAX_THUMB_BYTES,
  UPLOAD_CONTENT_TYPES,
  type UploadContentType,
} from '@/config/uploads'

export type PhotoUploadRequest = {
  eventId: string
  contentType: UploadContentType
  photoBytes: number
  thumbBytes: number
}

export type PhotoUploadParse = { ok: true; value: PhotoUploadRequest } | { ok: false; message: string }

const HEIC_TYPES = ['image/heic', 'image/heif']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function isSizeWithin(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= max
}

export function parsePhotoUploadRequest(body: unknown): PhotoUploadParse {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  if (!isUuid(input.eventId)) return { ok: false, message: 'Event không hợp lệ' }
  if (typeof input.contentType === 'string' && HEIC_TYPES.includes(input.contentType)) {
    return { ok: false, message: 'Ảnh HEIC chưa được hỗ trợ, hãy chọn ảnh JPEG hoặc chụp ở chế độ “Tương thích nhất”' }
  }
  const contentType = UPLOAD_CONTENT_TYPES.find((type) => type === input.contentType)
  if (!contentType) return { ok: false, message: 'Chỉ nhận ảnh JPEG, PNG hoặc WebP' }
  if (!isSizeWithin(input.photoBytes, MAX_PHOTO_BYTES)) return { ok: false, message: 'Ảnh quá lớn hoặc không hợp lệ' }
  if (!isSizeWithin(input.thumbBytes, MAX_THUMB_BYTES)) return { ok: false, message: 'Ảnh thu nhỏ không hợp lệ' }
  return { ok: true, value: { eventId: input.eventId, contentType, photoBytes: input.photoBytes, thumbBytes: input.thumbBytes } }
}

export type PhotoKeys = { objectKey: string; thumbKey: string }

export function buildPhotoKeys(eventId: string, photoId: string): PhotoKeys {
  return { objectKey: `events/${eventId}/${photoId}.jpg`, thumbKey: `events/${eventId}/${photoId}_thumb.jpg` }
}

export function hasJpegHeader(head: Uint8Array): boolean {
  return JPEG_MAGIC.every((byte, index) => head[index] === byte)
}

export type PhotoCompleteRequest = {
  eventId: string
  photoId: string
  width: number
  height: number
  takenAt: string | null
}

const MAX_DIMENSION_PX = 20_000

export function parsePhotoCompleteRequest(body: unknown): PhotoCompleteRequest | null {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const { eventId, photoId, width, height, takenAt } = input
  if (!isUuid(eventId) || !isUuid(photoId)) return null
  if (!isSizeWithin(width, MAX_DIMENSION_PX) || !isSizeWithin(height, MAX_DIMENSION_PX)) return null
  const validTakenAt = typeof takenAt === 'string' && !Number.isNaN(Date.parse(takenAt)) ? takenAt : null
  return { eventId, photoId, width, height, takenAt: validTakenAt }
}
