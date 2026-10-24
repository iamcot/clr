import { MAX_PHOTO_BYTES, UPLOAD_CONTENT_TYPES } from '@/config/uploads'

export const IMAGE_PURPOSES = ['cover', 'certificate'] as const
export type ImagePurpose = (typeof IMAGE_PURPOSES)[number]

export type ImageUploadRequest = { purpose: ImagePurpose; bytes: number }
export type ImageUploadParse = { ok: true; value: ImageUploadRequest } | { ok: false; message: string }

const KEY_PREFIX: Record<ImagePurpose, string> = { cover: 'covers', certificate: 'certificates' }

// Ảnh bìa do BCN đăng; giấy chứng nhận thì thành viên tự tải lên
export function canUploadPurpose(purpose: ImagePurpose, isBcn: boolean): boolean {
  return purpose === 'certificate' || isBcn
}

export function parseImageUploadRequest(body: unknown): ImageUploadParse {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const purpose = IMAGE_PURPOSES.find((item) => item === input.purpose)
  if (!purpose) return { ok: false, message: 'Loại ảnh không hợp lệ' }
  if (!UPLOAD_CONTENT_TYPES.some((type) => type === input.contentType)) {
    return { ok: false, message: 'Chỉ nhận ảnh JPEG, PNG hoặc WebP' }
  }
  const bytes = input.bytes
  if (typeof bytes !== 'number' || !Number.isInteger(bytes) || bytes <= 0 || bytes > MAX_PHOTO_BYTES) {
    return { ok: false, message: 'Ảnh quá lớn hoặc không hợp lệ' }
  }
  return { ok: true, value: { purpose, bytes } }
}

// Tên file ngẫu nhiên khó đoán, đủ cho mức nhạy cảm thấp của ảnh bìa và giấy chứng nhận
export function buildImageKey(purpose: ImagePurpose, id: string): string {
  return `${KEY_PREFIX[purpose]}/${id}.jpg`
}
