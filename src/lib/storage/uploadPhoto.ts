import { NonRetryableError } from '@/lib/storage/uploadQueue'
import type { PreparedImage } from '@/lib/storage/prepareImage'

type SignedUpload = { photoId: string; photoUploadUrl: string; thumbUploadUrl: string }

async function postJson<Result>(url: string, body: unknown): Promise<Result> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.ok) return (await response.json()) as Result
  const message = ((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? 'Tải ảnh lên thất bại'
  if (response.status >= 400 && response.status < 500) throw new NonRetryableError(message)
  throw new Error(message)
}

function putBlob(url: string, blob: Blob, onProgress: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    request.setRequestHeader('Content-Type', 'image/jpeg')
    request.upload.onprogress = (event) => onProgress(event.loaded)
    request.onload = () =>
      request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Máy chủ ảnh trả lỗi ${request.status}`))
    request.onerror = () => reject(new Error('Mất kết nối khi tải ảnh'))
    request.send(blob)
  })
}

// Một lần thử đầy đủ: xin link ký, PUT ảnh và ảnh nhỏ, báo hoàn tất. onProgress nhận tỉ lệ 0..1
export async function uploadPreparedPhoto(
  eventId: string,
  image: PreparedImage,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const signed = await postJson<SignedUpload>('/api/uploads', {
    eventId,
    contentType: 'image/jpeg',
    photoBytes: image.photo.size,
    thumbBytes: image.thumb.size,
  })
  const total = image.photo.size + image.thumb.size
  await putBlob(signed.thumbUploadUrl, image.thumb, (loaded) => onProgress(loaded / total))
  await putBlob(signed.photoUploadUrl, image.photo, (loaded) => onProgress((image.thumb.size + loaded) / total))
  await postJson('/api/uploads/complete', {
    eventId,
    photoId: signed.photoId,
    width: image.width,
    height: image.height,
    takenAt: image.takenAt,
  })
  onProgress(1)
}
