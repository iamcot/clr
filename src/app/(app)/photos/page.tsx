import Image from 'next/image'
import Link from 'next/link'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadAlbumEntries } from '@/lib/events/loadPhotos'
import { formatDateVi } from '@/lib/format/dateTime'

export default async function PhotosPage() {
  await requireActiveMember()
  const entries = await loadAlbumEntries()

  return (
    <section>
      <h1 className="text-2xl font-black">Album ảnh</h1>
      {entries.length === 0 && <p className="mt-3 text-muted">Chưa có ảnh nào.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {entries.map(({ event, photoCount, previews }) => (
          <li key={event.id} className="overflow-hidden rounded-2xl border border-line bg-white">
            <Link href={`/events/${event.id}/photos`} className="block active:opacity-70">
              <div className="grid grid-cols-4 gap-0.5 bg-line">
                {previews.map((url) => (
                  <Image key={url} src={url} alt="" width={160} height={160} className="aspect-square object-cover" unoptimized />
                ))}
              </div>
              <div className="p-3">
                <p className="font-black">{event.title}</p>
                <p className="text-sm text-muted">
                  {formatDateVi(event.startsAt)} · {photoCount} ảnh
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
