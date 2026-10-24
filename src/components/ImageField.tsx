'use client'

import { useState } from 'react'
import type { ImagePurpose } from '@/lib/storage/imageUploadRules'
import { uploadSingleImage } from '@/lib/storage/uploadSingleImage'

type ImageFieldProps = { name: string; purpose: ImagePurpose; defaultValue?: string }

export default function ImageField({ name, purpose, defaultValue = '' }: ImageFieldProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const uploading = progress !== null

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    setProgress(0)
    try {
      setImageUrl(await uploadSingleImage(file, purpose, setProgress))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Tải ảnh lên thất bại')
    }
    setProgress(null)
  }

  return (
    <div>
      <input type="hidden" name={name} value={imageUrl} />
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Ảnh đã chọn" className="mb-2 max-h-48 w-full rounded-lg object-cover" />
      )}
      <div className="flex gap-2">
        <label
          className={`flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line bg-white px-3 font-bold ${
            uploading ? 'opacity-60' : 'active:bg-line'
          }`}
        >
          {uploading ? `Đang tải ${Math.round((progress ?? 0) * 100)}%` : imageUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
            className="sr-only"
          />
        </label>
        {imageUrl && !uploading && (
          <button
            type="button"
            onClick={() => setImageUrl('')}
            className="min-h-11 rounded-lg border border-line bg-white px-4 font-bold text-danger"
          >
            Bỏ ảnh
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
