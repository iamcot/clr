import Link from 'next/link'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import PhotoGrid from '@/components/PhotoGrid'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadEventDetail } from '@/lib/events/loadEvents'
import { loadEventPhotos } from '@/lib/events/loadPhotos'
import { filterMyPhotos } from '@/lib/events/photoFilter'

export default async function EventPhotosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mine?: string }>
}) {
  const member = await requireActiveMember()
  const { id } = await params
  const mineOnly = (await searchParams).mine === '1'
  const event = await loadEventDetail(id, member.id)
  if (!event) notFound()
  const allPhotos = await loadEventPhotos(id, member.id)
  const photos = mineOnly ? filterMyPhotos(allPhotos) : allPhotos

  return (
    <section>
      <BackLink href={`/events/${id}`}>{event.title}</BackLink>
      <h1 className="text-2xl font-black">Album ảnh</h1>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/events/${id}/photos`}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold ${
            mineOnly ? 'bg-white' : 'bg-brand text-white'
          }`}
        >
          Tất cả ({allPhotos.length})
        </Link>
        <Link
          href={`/events/${id}/photos?mine=1`}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold ${
            mineOnly ? 'bg-brand text-white' : 'bg-white'
          }`}
        >
          Ảnh có tôi
        </Link>
      </div>
      <div className="mt-3 -mx-4">
        <PhotoGrid photos={photos} uploadEventId={mineOnly ? undefined : id} />
      </div>
      {photos.length === 0 && (
        <p className="mt-4 text-muted">{mineOnly ? 'Chưa có ảnh nào gắn tên bạn.' : 'Chưa có ảnh nào.'}</p>
      )}
    </section>
  )
}
