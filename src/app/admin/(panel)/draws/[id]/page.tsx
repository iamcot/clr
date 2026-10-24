import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import DrawLive from '@/components/DrawLive'
import MultiSelectDropdown from '@/components/MultiSelectDropdown'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import { requireBcn } from '@/lib/auth/requireBcn'
import { cancelDraw, drawNext, finishDraw, lockDraw, setParticipant, startDraw } from '@/lib/draw/adminActions'
import { loadDrawDetail, loadDrawState, type DrawDetail } from '@/lib/draw/loadDraw'
import { countPrizeSlots } from '@/lib/draw/pick'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const TABS = ['run', 'participants'] as const

type Participant = DrawDetail['participants'][number]

async function loadMemberOptions() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members_public').select('id, display_name').order('display_name')
  return data ?? []
}

function DrawIdField({ drawId }: { drawId: string }) {
  return <input type="hidden" name="draw_id" value={drawId} />
}

function StateButton({
  draw,
  drawnCount,
  totalSlots,
}: {
  draw: DrawDetail
  drawnCount: number
  totalSlots: number
}) {
  if (draw.status === 'draft' && !draw.seedCommit) {
    return (
      <ActionForm action={lockDraw}>
        <DrawIdField drawId={draw.id} />
        <button type="submit" className={adminButtonClass('primary')}>
          Chốt danh sách, công bố mã commit
        </button>
      </ActionForm>
    )
  }
  if (draw.status === 'draft') {
    return (
      <ActionForm action={startDraw}>
        <DrawIdField drawId={draw.id} />
        <button type="submit" className={adminButtonClass('primary')}>
          Bắt đầu quay số
        </button>
      </ActionForm>
    )
  }
  if (draw.status === 'live') {
    const more = drawnCount < totalSlots
    return (
      <ActionForm action={more ? drawNext : finishDraw}>
        <DrawIdField drawId={draw.id} />
        <button type="submit" className={adminButtonClass('primary')}>
          {more ? 'Quay giải tiếp theo' : 'Kết thúc, công bố kết quả'}
        </button>
      </ActionForm>
    )
  }
  return null
}

function participantColumns(drawId: string, editable: boolean): DataTableColumn<Participant>[] {
  const columns: DataTableColumn<Participant>[] = [
    { key: 'name', header: 'Thành viên', cell: (participant) => <b>{participant.name}</b> },
  ]
  if (!editable) return columns
  return [
    ...columns,
    {
      key: 'remove',
      header: '',
      align: 'right',
      cell: (participant) => (
        <ActionForm action={setParticipant}>
          <DrawIdField drawId={drawId} />
          <input type="hidden" name="member_id" value={participant.memberId} />
          <input type="hidden" name="remove" value="true" />
          <button type="submit" className={adminButtonClass('danger')}>
            Bỏ
          </button>
        </ActionForm>
      ),
    },
  ]
}

function AddParticipants({
  draw,
  members,
}: {
  draw: DrawDetail
  members: { id: string | null; display_name: string | null }[]
}) {
  const joinedIds = new Set(draw.participants.map((participant) => participant.memberId))
  const candidates = members.filter((member) => member.id && !joinedIds.has(member.id))
  return (
    <AdminCard title="Thêm thành viên" className="mb-4">
      <ActionForm action={setParticipant} className="flex items-start gap-2">
        <DrawIdField drawId={draw.id} />
        <div className="min-w-0 flex-1">
          <MultiSelectDropdown
            key={draw.participants.length}
            name="member_id"
            placeholder="Chọn thành viên (chọn nhiều)"
            options={candidates.map((member) => ({ id: member.id ?? '', title: member.display_name ?? 'Thành viên' }))}
          />
        </div>
        <button type="submit" className={adminButtonClass('primary')}>
          Thêm
        </button>
      </ActionForm>
    </AdminCard>
  )
}

export default async function AdminDrawPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  await requireBcn()
  const { id } = await params
  const query = await searchParams
  const draw = await loadDrawDetail(id)
  const state = draw ? await loadDrawState(id) : null
  if (!draw || !state) notFound()
  const tab = pickTab(TABS, query.tab, 'run')
  const drawnCount = state.completed.length + (state.spinning ? 1 : 0)
  const editable = draw.status === 'draft' && !draw.seedCommit
  const members = editable && tab === 'participants' ? await loadMemberOptions() : []
  const totalSlots = countPrizeSlots(draw.prizes)
  const finalStatus = draw.status === 'done' || draw.status === 'cancelled'
  const paged = slicePage(draw.participants, parsePage(query.page))
  const basePath = `/admin/draws/${id}`

  return (
    <section>
      <AdminPageHeader
        title={draw.title}
        backHref="/admin/draws"
        backLabel="Quay số"
        description={`${drawnCount}/${totalSlots} giải đã quay · ${draw.participants.length} người tham gia`}
        actions={<StateButton draw={draw} drawnCount={drawnCount} totalSlots={totalSlots} />}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={draw.status === 'live' ? 'success' : 'info'}>{DRAW_STATUS_LABELS[draw.status]}</Badge>
        {draw.seedCommit && <span className="font-mono text-xs break-all text-muted">Mã commit: {draw.seedCommit}</span>}
      </div>
      {draw.cancelReason && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-danger">Đã huỷ: {draw.cancelReason}</p>}
      <AdminTabs
        items={[
          { href: basePath, label: 'Quay số', active: tab === 'run' },
          { href: `${basePath}?tab=participants`, label: `Người tham gia (${draw.participants.length})`, active: tab === 'participants' },
        ]}
      />

      {tab === 'run' && (
        <div className="mt-4">
          <DrawLive drawId={draw.id} initial={state} prizes={draw.prizes} participants={draw.participants} />
          {!finalStatus && (
            <AdminCard title="Huỷ đợt quay số" className="mt-4">
              <ActionForm action={cancelDraw} className="flex flex-col gap-2 md:flex-row">
                <DrawIdField drawId={draw.id} />
                <input name="reason" required placeholder="Lý do huỷ (hiện công khai)" className={ADMIN_INPUT_CLASS} />
                <button type="submit" className={adminButtonClass('danger')}>
                  Huỷ đợt quay
                </button>
              </ActionForm>
            </AdminCard>
          )}
        </div>
      )}

      {tab === 'participants' && (
        <div className="mt-4">
          {editable && <AddParticipants draw={draw} members={members} />}
          <DataTable
            columns={participantColumns(draw.id, editable)}
            rows={paged.rows}
            rowKey={(participant) => participant.memberId}
            emptyText="Chưa có ai trong danh sách."
          />
          <Pagination window={paged.window} hrefFor={(page) => hrefWithPage(basePath, query, page)} unit="người" />
        </div>
      )}
    </section>
  )
}
