'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import PhotoLightbox, { LIGHTBOX_BUTTON_CLASS } from '@/components/PhotoLightbox'
import { deletePhoto, setCoverFromPhoto, setPhotoHidden } from '@/lib/events/photoActions'
import type { PhotoView } from '@/lib/events/loadPhotos'

const SMALL_BUTTON = 'min-h-11 flex-1 rounded-lg border border-line bg-white text-xs font-bold'

function PhotoButtons({ photo, dark }: { photo: PhotoView; dark: boolean }) {
  const buttonClass = dark ? LIGHTBOX_BUTTON_CLASS : SMALL_BUTTON
  const dangerClass = dark ? 'text-red-300' : 'text-danger'
  return (
    <div className={`flex gap-1 ${dark ? 'flex-wrap justify-center gap-2' : 'mt-1'}`}>
      <ActionForm action={setPhotoHidden} className="flex flex-1">
        <input type="hidden" name="photo_id" value={photo.id} />
        <input type="hidden" name="hidden" value={photo.hidden ? '0' : '1'} />
        <button type="submit" className={`${buttonClass} flex-1`}>
          {photo.hidden ? 'Hiện' : 'Ẩn'}
        </button>
      </ActionForm>
      <ActionForm action={setCoverFromPhoto} className="flex flex-1">
        <input type="hidden" name="photo_id" value={photo.id} />
        <button type="submit" className={`${buttonClass} flex-1`}>
          Ảnh bìa
        </button>
      </ActionForm>
      <ActionForm action={deletePhoto} className="flex flex-1">
        <input type="hidden" name="photo_id" value={photo.id} />
        <button type="submit" className={`${buttonClass} ${dangerClass} flex-1`}>
          Xoá
        </button>
      </ActionForm>
    </div>
  )
}

export default function AdminPhotoGrid({ photos }: { photos: PhotoView[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.id} className="rounded-lg bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setOpenIndex(index)} className="block aspect-square w-full overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail đã nén sẵn trên R2 */}
              <img
                src={photo.thumbUrl}
                alt={photo.caption}
                loading="lazy"
                decoding="async"
                className={`size-full object-cover ${photo.hidden ? 'opacity-40' : ''}`}
              />
            </button>
            <PhotoButtons photo={photo} dark={false} />
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={openIndex}
          onChange={setOpenIndex}
          renderActions={(photo) => <PhotoButtons photo={photo} dark />}
        />
      )}
    </>
  )
}
