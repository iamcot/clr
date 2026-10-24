import Link from 'next/link'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import DrawLive from '@/components/DrawLive'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadDrawDetail, loadDrawState } from '@/lib/draw/loadDraw'

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveMember()
  const { id } = await params
  const draw = await loadDrawDetail(id)
  const state = draw ? await loadDrawState(id) : null
  if (!draw || !state) notFound()

  return (
    <section>
      <BackLink href="/draws">Quay số</BackLink>
      <h1 className="text-2xl font-black">{draw.title}</h1>
      <p className="text-sm text-muted">
        {DRAW_STATUS_LABELS[draw.status]} · {draw.participants.length} người tham gia
      </p>
      {draw.status === 'cancelled' && (
        <p className="mt-3 rounded-lg bg-danger/10 p-3 text-danger">Đã huỷ. Lý do: {draw.cancelReason}</p>
      )}
      <DrawLive drawId={draw.id} initial={state} prizes={draw.prizes} participants={draw.participants} />
      {draw.status === 'done' && (
        <Link href={`/draws/${draw.id}/verify`} className="mt-4 flex min-h-11 items-center font-bold text-brand-dark">
          Tự kiểm tra kết quả
        </Link>
      )}
      <h2 className="mt-6 text-lg font-black">Danh sách tham gia</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {draw.participants.map((participant) => (
          <li key={participant.memberId} className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
            {participant.name}
          </li>
        ))}
      </ul>
    </section>
  )
}
