'use client'

import { useRef } from 'react'
import type { PhotoView } from '@/lib/events/loadPhotos'

const SWIPE_THRESHOLD_PX = 50

export const LIGHTBOX_BUTTON_CLASS = 'min-h-11 rounded-full bg-white/15 px-4 text-sm font-bold text-white active:bg-white/30'

type PhotoLightboxProps = {
  photos: PhotoView[]
  index: number
  onChange: (next: number | null) => void
  renderActions: (photo: PhotoView) => React.ReactNode
}

function NavButton({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
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

export default function PhotoLightbox({ photos, index, onChange, renderActions }: PhotoLightboxProps) {
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 flex flex-col bg-black/95 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between p-2 text-white">
        <span className="px-2 text-sm">
          {index + 1}/{photos.length}
        </span>
        <button type="button" onClick={() => onChange(null)} className={LIGHTBOX_BUTTON_CLASS}>
          Đóng
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1">
        {index > 0 && <NavButton direction="prev" onClick={() => move(-1)} />}
        {index < photos.length - 1 && <NavButton direction="next" onClick={() => move(1)} />}
        <div
          className="flex min-h-0 flex-1 touch-pan-y items-center justify-center"
          onPointerDown={(event) => (swipeStartX.current = event.clientX)}
          onPointerUp={(event) => endSwipe(event.clientX)}
          onPointerCancel={() => (swipeStartX.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh trên R2 đã nén sẵn, không cần next/image */}
          <img src={photo.fullUrl} alt={photo.caption} className="max-h-full max-w-full object-contain" draggable={false} />
        </div>
      </div>
      {photo.caption && <p className="px-4 pb-2 text-center text-sm text-white">{photo.caption}</p>}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{renderActions(photo)}</div>
    </div>
  )
}
