import { prepareImage } from '@/lib/storage/prepareImage'
import type { ImagePurpose } from '@/lib/storage/imageUploadRules'
import { postJson, putBlob } from '@/lib/storage/uploadPhoto'

type SignedImageUpload = { uploadUrl: string; imageUrl: string }

// Nén ở trình duyệt, xin link ký rồi PUT lên R2; trả về link công khai của ảnh. onProgress nhận tỉ lệ 0..1
export async function uploadSingleImage(
  file: File,
  purpose: ImagePurpose,
  onProgress: (fraction: number) => void,
): Promise<string> {
  const image = await prepareImage(file).catch(() => {
    throw new Error('Không đọc được ảnh này (có thể là HEIC hoặc file hỏng)')
  })
  const signed = await postJson<SignedImageUpload>('/api/uploads/image', {
    purpose,
    contentType: 'image/jpeg',
    bytes: image.photo.size,
  })
  await putBlob(signed.uploadUrl, image.photo, (loaded) => onProgress(loaded / image.photo.size))
  return signed.imageUrl
}
