import Link from 'next/link'
import { notFound } from 'next/navigation'
import DrawLive from '@/components/DrawLive'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadDrawDetail } from '@/lib/draw/loadDraw'

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveMember()
  const { id } = await params
  const draw = await loadDrawDetail(id)
  if (!draw || draw.status === 'draft') notFound()

  return (
    <section>
      <Link href="/draws" className="flex min-h-11 items-center font-bold text-brand-dark">
        ← Quay số
      </Link>
      <h1 className="text-2xl font-black">{draw.title}</h1>
      <p className="text-sm text-muted">
        {DRAW_STATUS_LABELS[draw.status]} · {draw.participants.length} người tham gia
      </p>
      {draw.status === 'cancelled' && (
        <p className="mt-3 rounded-lg bg-danger/10 p-3 text-danger">Đã huỷ. Lý do: {draw.cancelReason}</p>
      )}
      <DrawLive
        drawId={draw.id}
        status={draw.status}
        prizes={draw.prizes}
        participantNames={draw.participants.map((participant) => participant.name)}
        results={draw.results}
        serverNowMs={draw.serverNowMs}
      />
      <div className="mt-4 rounded-lg bg-white p-3 text-sm shadow-sm">
        <p className="text-muted">Mã commit (công bố trước khi quay)</p>
        <p className="font-mono break-all">{draw.seedCommit}</p>
        {draw.status === 'done' && (
          <Link href={`/draws/${draw.id}/verify`} className="mt-2 flex min-h-11 items-center font-bold text-brand-dark underline">
            Tự kiểm tra kết quả
          </Link>
        )}
      </div>
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
