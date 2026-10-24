'use client'

import { useRef, useState } from 'react'
import ActionForm from '@/components/ActionForm'
import {
  UploadProgressList,
  UploadTile,
  usePhotoUpload,
} from '@/components/PhotoUploader'
import { deletePhoto, tagMyself, untagMyself } from '@/lib/events/photoActions'
import type { PhotoView } from '@/lib/events/loadPhotos'

const SWIPE_THRESHOLD_PX = 50
const BUTTON_CLASS =
  'min-h-11 rounded-full bg-white/15 px-4 text-sm font-bold text-white active:bg-white/30'

function sharePhoto(photo: PhotoView) {
  if (navigator.share)
    void navigator.share({
      title: photo.caption || 'Ảnh event CLR',
      url: photo.fullUrl,
    })
  else void navigator.clipboard?.writeText(photo.fullUrl)
}

function PhotoActions({ photo }: { photo: PhotoView }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a
        href={photo.fullUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className={`${BUTTON_CLASS} flex items-center`}
      >
        Tải ảnh gốc
      </a>
      <button
        type="button"
        onClick={() => sharePhoto(photo)}
        className={BUTTON_CLASS}
      >
        Chia sẻ
      </button>
      <ActionForm action={photo.taggedMe ? untagMyself : tagMyself}>
        <input type="hidden" name="photo_id" value={photo.id} />
        <input type="hidden" name="event_id" value={photo.eventId} />
        <button type="submit" className={BUTTON_CLASS}>
          {photo.taggedMe ? 'Bỏ gắn tên tôi' : 'Gắn tên tôi'}
        </button>
      </ActionForm>
      {photo.uploadedByMe && (
        <ActionForm action={deletePhoto}>
          <input type="hidden" name="photo_id" value={photo.id} />
          <button type="submit" className={`${BUTTON_CLASS} text-red-300`}>
            Xoá ảnh
          </button>
        </ActionForm>
      )}
    </div>
  )
}

function NavButton({
  direction,
  onClick,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? 'Ảnh trước' : 'Ảnh sau'}
      className={`absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white active:bg-black/60 ${
        isPrev ? 'left-2' : 'right-2'
      }`}
    >
      {isPrev ? '‹' : '›'}
    </button>
  )
}

function Lightbox({
  photos,
  index,
  onChange,
}: {
  photos: PhotoView[];
  index: number;
  onChange: (next: number | null) => void;
}) {
  const swipeStartX = useRef<number | null>(null)
  const photo = photos[index]
  if (!photo) return null

  function move(step: number) {
    const next = index + step
    if (next >= 0 && next < photos.length) onChange(next)
  }

  function endSwipe(clientX: number) {
    const startX = swipeStartX.current
    swipeStartX.current = null
    if (startX === null) return
    const delta = clientX - startX
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) move(delta < 0 ? 1 : -1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-30 flex flex-col bg-black/95 pt-[env(safe-area-inset-top)]"
    >
      <div className="flex items-center justify-between p-2 text-white">
        <span className="px-2 text-sm">
          {index + 1}/{photos.length}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className={BUTTON_CLASS}
        >
          Đóng
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1">
        {index > 0 && <NavButton direction="prev" onClick={() => move(-1)} />}
        {index < photos.length - 1 && (
          <NavButton direction="next" onClick={() => move(1)} />
        )}
        <div
          className="flex min-h-0 flex-1 items-center justify-center touch-pan-y"
          onPointerDown={(event) => (swipeStartX.current = event.clientX)}
          onPointerUp={(event) => endSwipe(event.clientX)}
          onPointerCancel={() => (swipeStartX.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh trên R2 đã nén sẵn, không cần next/image */}
          <img
            src={photo.fullUrl}
            alt={photo.caption}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        </div>
      </div>
      {photo.caption && (
        <p className="px-4 pb-2 text-center text-sm text-white">
          {photo.caption}
        </p>
      )}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <PhotoActions photo={photo} />
      </div>
    </div>
  )
}

type PhotoGridProps = { photos: PhotoView[]; uploadEventId?: string };

export default function PhotoGrid({ photos, uploadEventId }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const upload = usePhotoUpload(uploadEventId ?? '')

  return (
    <>
      <ul className="grid grid-cols-4 gap-1">
        {uploadEventId && <UploadTile upload={upload} />}
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="block aspect-square w-full overflow-hidden bg-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail 480px đã nén sẵn trên R2 */}
              <img
                src={photo.thumbUrl}
                alt={photo.caption}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className={`size-full object-cover ${photo.hidden ? 'opacity-40' : ''}`}
              />
            </button>
          </li>
        ))}
      </ul>
      {uploadEventId && <UploadProgressList items={upload.items} />}
      {openIndex !== null && (
        <Lightbox photos={photos} index={openIndex} onChange={setOpenIndex} />
      )}
    </>
  )
}
