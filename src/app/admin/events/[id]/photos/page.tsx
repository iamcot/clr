import { notFound } from 'next/navigation'
import AdminPhotoGrid from '@/components/AdminPhotoGrid'
import BackLink from '@/components/BackLink'
import PhotoUploader from '@/components/PhotoUploader'
import { requireBcn } from '@/lib/auth/requireBcn'
import { loadAdminEvent } from '@/lib/events/loadAdminEvents'
import { loadEventPhotos } from '@/lib/events/loadPhotos'

export default async function AdminEventPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const bcn = await requireBcn()
  const { id } = await params
  const event = await loadAdminEvent(id)
  if (!event) notFound()
  const photos = await loadEventPhotos(id, bcn.id)

  return (
    <section>
      <BackLink href={`/admin/events/${id}`}>{event.title}</BackLink>
      <h1 className="mt-2 mb-4 text-2xl font-black">Quản lý ảnh ({photos.length})</h1>
      <div className="mb-4">
        <PhotoUploader eventId={id} />
      </div>
      <AdminPhotoGrid photos={photos} />
      {photos.length === 0 && <p className="text-muted">Chưa có ảnh nào.</p>}
    </section>
  )
}
