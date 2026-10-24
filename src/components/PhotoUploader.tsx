'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { MAX_FILES_PER_BATCH, UPLOAD_CONCURRENCY, UPLOAD_RETRIES, UPLOAD_RETRY_DELAY_MS } from '@/config/uploads'
import { prepareImage } from '@/lib/storage/prepareImage'
import { NonRetryableError, runWithConcurrency, withRetries } from '@/lib/storage/uploadQueue'
import { uploadPreparedPhoto } from '@/lib/storage/uploadPhoto'

type UploadItem = {
  name: string
  stage: 'waiting' | 'preparing' | 'uploading' | 'done' | 'failed'
  fraction: number
  message: string
}

const STAGE_LABELS: Record<UploadItem['stage'], string> = {
  waiting: 'Đang chờ',
  preparing: 'Đang nén ảnh',
  uploading: 'Đang tải lên',
  done: 'Xong',
  failed: 'Lỗi',
}

function ItemRow({ item }: { item: UploadItem }) {
  return (
    <li className="rounded-lg bg-white shadow-sm p-2 text-sm">
      <div className="flex justify-between gap-2">
        <span className="truncate">{item.name}</span>
        <span className={item.stage === 'failed' ? 'text-danger' : 'text-muted'}>{STAGE_LABELS[item.stage]}</span>
      </div>
      {item.stage === 'failed' && <p className="text-xs text-danger">{item.message}</p>}
      {item.stage === 'uploading' && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-brand" style={{ width: `${Math.round(item.fraction * 100)}%` }} />
        </div>
      )}
    </li>
  )
}

export default function PhotoUploader({ eventId }: { eventId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [busy, setBusy] = useState(false)

  function patchItem(index: number, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  async function uploadOne(file: File, index: number) {
    try {
      patchItem(index, { stage: 'preparing' })
      const image = await prepareImage(file).catch(() => {
        throw new NonRetryableError('Không đọc được ảnh này (có thể là HEIC hoặc file hỏng)')
      })
      patchItem(index, { stage: 'uploading', fraction: 0 })
      await withRetries(
        () => uploadPreparedPhoto(eventId, image, (fraction) => patchItem(index, { fraction })),
        UPLOAD_RETRIES,
        UPLOAD_RETRY_DELAY_MS,
      )
      patchItem(index, { stage: 'done', fraction: 1 })
    } catch (error) {
      patchItem(index, { stage: 'failed', message: error instanceof Error ? error.message : 'Tải lên thất bại' })
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, MAX_FILES_PER_BATCH)
    if (files.length === 0) return
    setItems(files.map((file) => ({ name: file.name, stage: 'waiting', fraction: 0, message: '' })))
    setBusy(true)
    await runWithConcurrency(files, UPLOAD_CONCURRENCY, uploadOne)
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  return (
    <div>
      <label
        className={`flex min-h-12 items-center justify-center rounded-full bg-brand font-bold text-white ${
          busy ? 'opacity-60' : 'active:bg-brand-dark'
        }`}
      >
        {busy ? 'Đang tải ảnh lên...' : 'Thêm ảnh'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
        />
      </label>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((item, index) => (
          <ItemRow key={`${item.name}-${index}`} item={item} />
        ))}
      </ul>
    </div>
  )
}
