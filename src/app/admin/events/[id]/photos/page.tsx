import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import PhotoUploader from '@/components/PhotoUploader'
import { requireBcn } from '@/lib/auth/requireBcn'
import { loadAdminEvent } from '@/lib/events/loadAdminEvents'
import { loadEventPhotos } from '@/lib/events/loadPhotos'
import { deletePhoto, setCoverFromPhoto, setPhotoHidden } from '@/lib/events/photoActions'

const SMALL_BUTTON = 'min-h-11 flex-1 rounded-lg border border-line bg-white text-xs font-bold'

export default async function AdminEventPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const bcn = await requireBcn()
  const { id } = await params
  const event = await loadAdminEvent(id)
  if (!event) notFound()
  const photos = await loadEventPhotos(id, bcn.id)

  return (
    <section>
      <Link href={`/admin/events/${id}`} className="text-sm text-muted underline">
        ← {event.title}
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-black">Quản lý ảnh ({photos.length})</h1>
      <div className="mb-4">
        <PhotoUploader eventId={id} />
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {photos.map((photo) => (
          <li key={photo.id} className="rounded-lg bg-white p-1">
            <Image
              src={photo.thumbUrl}
              alt=""
              width={240}
              height={240}
              className={`aspect-square w-full rounded object-cover ${photo.hidden ? 'opacity-40' : ''}`}
              unoptimized
            />
            <div className="mt-1 flex gap-1">
              <ActionForm action={setPhotoHidden} className="flex flex-1">
                <input type="hidden" name="photo_id" value={photo.id} />
                <input type="hidden" name="hidden" value={photo.hidden ? '0' : '1'} />
                <button type="submit" className={SMALL_BUTTON}>
                  {photo.hidden ? 'Hiện' : 'Ẩn'}
                </button>
              </ActionForm>
              <ActionForm action={setCoverFromPhoto} className="flex flex-1">
                <input type="hidden" name="photo_id" value={photo.id} />
                <button type="submit" className={SMALL_BUTTON}>
                  Ảnh bìa
                </button>
              </ActionForm>
              <ActionForm action={deletePhoto} className="flex flex-1">
                <input type="hidden" name="photo_id" value={photo.id} />
                <button type="submit" className={`${SMALL_BUTTON} text-danger`}>
                  Xoá
                </button>
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>
      {photos.length === 0 && <p className="text-muted">Chưa có ảnh nào.</p>}
    </section>
  )
}
