import Link from 'next/link'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadDrawList } from '@/lib/draw/loadDraw'

export default async function AdminDrawsPage() {
  await requireBcn()
  const draws = await loadDrawList()

  return (
    <section>
      <h1 className="text-2xl font-black">Quay số</h1>
      <Link href="/admin/draws/new" className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-brand font-bold text-white">
        Tạo đợt quay số
      </Link>
      <ul className="mt-4 flex flex-col gap-2">
        {draws.map((draw) => (
          <li key={draw.id}>
            <Link href={`/admin/draws/${draw.id}`} className="block rounded-lg bg-white p-3">
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
