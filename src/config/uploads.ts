export const UPLOAD_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type UploadContentType = (typeof UPLOAD_CONTENT_TYPES)[number]

export const PRESIGN_TTL_SECONDS = 300

// Ảnh đã nén ở trình duyệt: cạnh dài 2048px chất lượng 0,82 thường dưới 1 MB; chặn ở 3 MB để loại ảnh chưa nén
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024
export const MAX_THUMB_BYTES = 300 * 1024
export const PHOTO_MAX_EDGE_PX = 2048
export const THUMB_EDGE_PX = 480
export const PHOTO_JPEG_QUALITY = 0.82
export const THUMB_JPEG_QUALITY = 0.75

export const UPLOAD_CONCURRENCY = 3
export const UPLOAD_RETRIES = 2
export const UPLOAD_RETRY_DELAY_MS = 1500
export const MAX_FILES_PER_BATCH = 60

export const JPEG_MAGIC = [0xff, 0xd8, 0xff] as const
