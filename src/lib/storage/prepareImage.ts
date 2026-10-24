import { PHOTO_JPEG_QUALITY, PHOTO_MAX_EDGE_PX, THUMB_EDGE_PX, THUMB_JPEG_QUALITY } from '@/config/uploads'
import { readExifTakenAt } from '@/lib/storage/exifDate'

const EXIF_HEAD_BYTES = 128 * 1024

export type PreparedImage = {
  photo: Blob
  thumb: Blob
  width: number
  height: number
  takenAt: string | null
}

export function scaleToFit(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { width, height }
  const ratio = maxEdge / longEdge
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function encodeJpeg(bitmap: ImageBitmap, size: { width: number; height: number }, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, size.width, size.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Không nén được ảnh'))), 'image/jpeg', quality)
  })
}

// Vẽ lại qua canvas nên EXIF (kể cả toạ độ GPS) không còn trong ảnh gửi đi; ngày chụp đọc từ file gốc
export async function prepareImage(file: File): Promise<PreparedImage> {
  const takenAt = readExifTakenAt(await file.slice(0, EXIF_HEAD_BYTES).arrayBuffer())
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const photoSize = scaleToFit(bitmap.width, bitmap.height, PHOTO_MAX_EDGE_PX)
    const thumbSize = scaleToFit(bitmap.width, bitmap.height, THUMB_EDGE_PX)
    const [photo, thumb] = await Promise.all([
      encodeJpeg(bitmap, photoSize, PHOTO_JPEG_QUALITY),
      encodeJpeg(bitmap, thumbSize, THUMB_JPEG_QUALITY),
    ])
    return { photo, thumb, width: photoSize.width, height: photoSize.height, takenAt }
  } finally {
    bitmap.close()
  }
}
