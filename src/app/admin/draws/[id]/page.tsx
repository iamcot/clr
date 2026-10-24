import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import ActionForm from '@/components/ActionForm'
import DrawLive from '@/components/DrawLive'
import MultiSelectDropdown from '@/components/MultiSelectDropdown'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { requireBcn } from '@/lib/auth/requireBcn'
import { cancelDraw, drawNext, finishDraw, lockDraw, setParticipant, startDraw } from '@/lib/draw/adminActions'
import { loadDrawDetail, loadDrawState, type DrawDetail } from '@/lib/draw/loadDraw'
import { countPrizeSlots } from '@/lib/draw/pick'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const BUTTON_CLASS = 'min-h-11 rounded-lg border border-line bg-white px-4 font-bold'
const PRIMARY_CLASS = 'min-h-12 w-full rounded-full bg-brand font-bold text-white'

async function loadMemberOptions() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members_public').select('id, display_name').order('display_name')
  return data ?? []
}

function DrawIdField({ drawId }: { drawId: string }) {
  return <input type="hidden" name="draw_id" value={drawId} />
}

function ParticipantEditor({ draw, members }: { draw: DrawDetail; members: { id: string | null; display_name: string | null }[] }) {
  const joinedIds = new Set(draw.participants.map((participant) => participant.memberId))
  const candidates = members.filter((member) => member.id && !joinedIds.has(member.id))
  return (
    <div className="mt-4">
      <h2 className="text-lg font-black">Danh sách tham gia ({draw.participants.length})</h2>
      <ActionForm action={setParticipant} className="mt-2 flex items-start gap-2">
        <DrawIdField drawId={draw.id} />
        <div className="min-w-0 flex-1">
          <MultiSelectDropdown
            key={draw.participants.length}
            name="member_id"
            placeholder="Thêm thành viên (chọn nhiều)"
            options={candidates.map((member) => ({ id: member.id ?? '', title: member.display_name ?? 'Thành viên' }))}
          />
        </div>
        <button type="submit" className={BUTTON_CLASS}>
          Thêm
        </button>
      </ActionForm>
      <ul className="mt-2 flex flex-col gap-1">
        {draw.participants.map((participant) => (
          <li key={participant.memberId} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 shadow-sm">
            <span className="truncate">{participant.name}</span>
            <ActionForm action={setParticipant}>
              <DrawIdField drawId={draw.id} />
              <input type="hidden" name="member_id" value={participant.memberId} />
              <input type="hidden" name="remove" value="true" />
              <button type="submit" className="min-h-11 px-2 font-bold text-danger">
                Bỏ
              </button>
            </ActionForm>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function AdminDrawPage({ params }: { params: Promise<{ id: string }> }) {
  await requireBcn()
  const { id } = await params
  const draw = await loadDrawDetail(id)
  const state = draw ? await loadDrawState(id) : null
  if (!draw || !state) notFound()
  const drawnCount = state.completed.length + (state.spinning ? 1 : 0)
  const members = draw.status === 'draft' && !draw.seedCommit ? await loadMemberOptions() : []
  const totalSlots = countPrizeSlots(draw.prizes)
  const finalStatus = draw.status === 'done' || draw.status === 'cancelled'

  return (
    <section>
      <BackLink href="/admin/draws">Quay số</BackLink>
      <h1 className="mt-2 text-2xl font-black">{draw.title}</h1>
      <p className="text-sm text-muted">
        {DRAW_STATUS_LABELS[draw.status]} · {drawnCount}/{totalSlots} giải đã quay
      </p>
      {draw.seedCommit && (
        <p className="mt-2 rounded-lg bg-white p-3 font-mono text-xs break-all shadow-sm">Mã commit: {draw.seedCommit}</p>
      )}
      {draw.cancelReason && <p className="mt-2 rounded-lg bg-danger/10 p-3 text-danger">Đã huỷ: {draw.cancelReason}</p>}

      <DrawLive drawId={draw.id} initial={state} prizes={draw.prizes} participants={draw.participants} />

      {draw.status === 'draft' && !draw.seedCommit && (
        <>
          <ParticipantEditor draw={draw} members={members} />
          <ActionForm action={lockDraw} className="mt-4">
            <DrawIdField drawId={draw.id} />
            <button type="submit" className={PRIMARY_CLASS}>
              Chốt danh sách và công bố mã commit
            </button>
          </ActionForm>
        </>
      )}
      {draw.status === 'draft' && draw.seedCommit && (
        <ActionForm action={startDraw} className="mt-4">
          <DrawIdField drawId={draw.id} />
          <button type="submit" className={PRIMARY_CLASS}>
            Bắt đầu quay số
          </button>
        </ActionForm>
      )}
      {draw.status === 'live' && (
        <ActionForm action={drawnCount < totalSlots ? drawNext : finishDraw} className="mt-4">
          <DrawIdField drawId={draw.id} />
          <button type="submit" className={PRIMARY_CLASS}>
            {drawnCount < totalSlots ? 'Quay giải tiếp theo' : 'Kết thúc và công bố kết quả'}
          </button>
        </ActionForm>
      )}
      {!finalStatus && (
        <ActionForm action={cancelDraw} className="mt-6 flex flex-col gap-2">
          <DrawIdField drawId={draw.id} />
          <input
            name="reason"
            required
            placeholder="Lý do huỷ (hiện công khai)"
            className="min-h-11 w-full rounded-lg border border-line bg-white px-3"
          />
          <button type="submit" className={`${BUTTON_CLASS} text-danger`}>
            Huỷ đợt quay số
          </button>
        </ActionForm>
      )}
    </section>
  )
}
