import Link from 'next/link'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadDrawList } from '@/lib/draw/loadDraw'

export default async function DrawsPage() {
  await requireActiveMember()
  const draws = await loadDrawList()

  return (
    <section>
      <h1 className="text-2xl font-black">Quay số</h1>
      <ul className="mt-4 flex flex-col gap-2">
        {draws.map((draw) => (
          <li key={draw.id}>
            <Link href={`/draws/${draw.id}`} className="block rounded-lg bg-white p-3 shadow-sm">
              <p className="font-bold">{draw.title}</p>
              <p className="text-sm text-muted">
                {DRAW_STATUS_LABELS[draw.status]} · {formatDateTimeVi(draw.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {draws.length === 0 && <p className="mt-4 text-muted">Chưa có đợt quay số nào.</p>}
    </section>
  )
}
