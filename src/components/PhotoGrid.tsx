'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import PhotoLightbox, { LIGHTBOX_BUTTON_CLASS } from '@/components/PhotoLightbox'
import { UploadProgressList, UploadTile, usePhotoUpload } from '@/components/PhotoUploader'
import { deletePhoto, tagMyself, untagMyself } from '@/lib/events/photoActions'
import type { PhotoView } from '@/lib/events/loadPhotos'

type PhotoGridProps = { photos: PhotoView[]; uploadEventId?: string }

function sharePhoto(photo: PhotoView) {
  if (navigator.share) void navigator.share({ title: photo.caption || 'Ảnh event CLR', url: photo.fullUrl })
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
        className={`${LIGHTBOX_BUTTON_CLASS} flex items-center`}
      >
        Tải ảnh gốc
      </a>
      <button type="button" onClick={() => sharePhoto(photo)} className={LIGHTBOX_BUTTON_CLASS}>
        Chia sẻ
      </button>
      <ActionForm action={photo.taggedMe ? untagMyself : tagMyself}>
        <input type="hidden" name="photo_id" value={photo.id} />
        <input type="hidden" name="event_id" value={photo.eventId} />
        <button type="submit" className={LIGHTBOX_BUTTON_CLASS}>
          {photo.taggedMe ? 'Bỏ gắn tên tôi' : 'Gắn tên tôi'}
        </button>
      </ActionForm>
      {photo.uploadedByMe && (
        <ActionForm action={deletePhoto}>
          <input type="hidden" name="photo_id" value={photo.id} />
          <button type="submit" className={`${LIGHTBOX_BUTTON_CLASS} text-red-300`}>
            Xoá ảnh
          </button>
        </ActionForm>
      )}
    </div>
  )
}

export default function PhotoGrid({ photos, uploadEventId }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const upload = usePhotoUpload(uploadEventId ?? '')

  return (
    <>
      <ul className="grid grid-cols-4 gap-1">
        {uploadEventId && <UploadTile upload={upload} />}
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button type="button" onClick={() => setOpenIndex(index)} className="block aspect-square w-full overflow-hidden bg-line">
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
        <PhotoLightbox photos={photos} index={openIndex} onChange={setOpenIndex} renderActions={(photo) => <PhotoActions photo={photo} />} />
      )}
    </>
  )
}
