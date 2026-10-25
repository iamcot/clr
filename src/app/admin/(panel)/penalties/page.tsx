import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import DateInput from '@/components/admin/DateInput'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge, { type BadgeTone } from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import StatCard from '@/components/admin/StatCard'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import { PAYMENT_METHOD_LABELS, PENALTY_STATUS_LABELS, PENALTY_TYPES, type PenaltyStatus } from '@/config/penalties'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import {
  addManualPenalties,
  applyPenaltySelection,
  saveFundSettings,
  unmarkPenaltyPaid,
} from '@/lib/penalties/adminActions'
import { currentMonthVn, summarizePenalties } from '@/lib/penalties/calc'
import { loadFundSettings } from '@/lib/penalties/fundSettings'
import { loadPenalties, type PenaltyFilters, type PenaltyListRow } from '@/lib/penalties/loadPenalties'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const INPUT_CLASS = ADMIN_INPUT_CLASS
const MEMBER_PICKER_LIMIT = 800

async function loadActiveMembers() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('members')
    .select('id, display_name, member_code')
    .eq('status', 'active')
    .order('display_name')
    .range(0, MEMBER_PICKER_LIMIT - 1)
  return data ?? []
}

const STATUS_TONES: Record<PenaltyStatus, BadgeTone> = {
  unpaid: 'danger',
  paid: 'success',
  waived: 'neutral',
}

function MemberCell({ row }: { row: PenaltyListRow }) {
  return (
    <span className="block">
      <span className="block font-bold">{row.memberName}</span>
      <span className="text-xs font-normal text-muted">{row.memberCode}</span>
    </span>
  )
}

const BASE_COLUMNS: DataTableColumn<PenaltyListRow>[] = [
  { key: 'member', header: 'Thành viên', cell: (row) => <MemberCell row={row} /> },
  { key: 'type', header: 'Loại', hideBelowMd: true, cell: (row) => row.typeName },
  { key: 'reason', header: 'Lý do', hideBelowMd: true, cell: (row) => row.reason || '—' },
  { key: 'date', header: 'Ngày', hideBelowMd: true, cell: (row) => formatDateVi(row.createdAt) },
  { key: 'amount', header: 'Số tiền', align: 'right', cell: (row) => <b>{formatVndCompact(row.amount)}</b> },
]

const OPEN_COLUMNS: DataTableColumn<PenaltyListRow>[] = [
  {
    key: 'select',
    header: '',
    cell: (row) => <input type="checkbox" name="ids" value={row.id} aria-label="Chọn khoản phạt" className="size-5" />,
  },
  ...BASE_COLUMNS,
]

function closedDetail(row: PenaltyListRow): string {
  const method = row.paidMethod
    ? (PAYMENT_METHOD_LABELS[row.paidMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? row.paidMethod)
    : null
  return [method, row.paymentRef, row.waivedReason].filter(Boolean).join(' · ')
}

const CLOSED_COLUMNS: DataTableColumn<PenaltyListRow>[] = [
  ...BASE_COLUMNS.slice(0, 4),
  { key: 'amount', header: 'Số tiền', align: 'right', cell: (row) => <b>{formatVndCompact(row.amount)}</b> },
  {
    key: 'status',
    header: 'Trạng thái',
    cell: (row) => (
      <div>
        <Badge tone={STATUS_TONES[row.status]}>{PENALTY_STATUS_LABELS[row.status]}</Badge>
        {closedDetail(row) && <p className="mt-1 text-xs text-muted">{closedDetail(row)}</p>}
        {row.status === 'paid' && <UnmarkForm id={row.id} />}
      </div>
    ),
  },
]

function UnmarkForm({ id }: { id: string }) {
  return (
    <details>
      <summary className="flex min-h-9 cursor-pointer items-center text-xs font-bold text-brand-dark">
        Huỷ trạng thái nộp
      </summary>
      <ActionForm action={unmarkPenaltyPaid} className="flex flex-col gap-2 pb-2">
        <input type="hidden" name="id" value={id} />
        <input name="reason" placeholder="Lý do (bắt buộc)" required className={INPUT_CLASS} />
        <button type="submit" className={adminButtonClass('secondary')}>
          Chuyển về chưa nộp
        </button>
      </ActionForm>
    </details>
  )
}

export default async function AdminPenaltiesPage({ searchParams }: { searchParams: Promise<PenaltyFilters & { openPage?: string; closedPage?: string }> }) {
  const rawParams = await searchParams
  const { openPage, closedPage, ...filters } = rawParams
  const month = filters.month ?? currentMonthVn(new Date())
  const effective = { ...filters, month }
  const [rows, members, fund] = await Promise.all([loadPenalties(effective), loadActiveMembers(), loadFundSettings()])
  const totals = summarizePenalties(rows)
  const open = slicePage(rows.filter((row) => row.status === 'unpaid'), parsePage(openPage))
  const closed = slicePage(rows.filter((row) => row.status !== 'unpaid'), parsePage(closedPage))
  const csvQuery = new URLSearchParams({
    month,
    status: filters.status ?? '',
    type: filters.typeCode ?? '',
  })

  return (
    <section>
      <AdminPageHeader
        title="Thưởng phạt"
        description="Khoản phạt, thu nộp và danh sách thưởng"
        actions={
          <>
            <Link href="/admin/rewards" className={adminButtonClass('secondary')}>
              Danh sách thưởng
            </Link>
            <Link
              href={`/admin/penalties/csv?${csvQuery.toString()}`}
              prefetch={false}
              className={adminButtonClass('secondary')}
            >
              Xuất CSV
            </Link>
          </>
        }
      />

      <form method="get" className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <DateInput name="month" type="month" defaultValue={month} />
        <select name="status" defaultValue={filters.status ?? ''} className={INPUT_CLASS}>
          <option value="">Mọi trạng thái</option>
          {(Object.keys(PENALTY_STATUS_LABELS) as PenaltyStatus[]).map((status) => (
            <option key={status} value={status}>
              {PENALTY_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select name="typeCode" defaultValue={filters.typeCode ?? ''} className={INPUT_CLASS}>
          <option value="">Mọi loại</option>
          {PENALTY_TYPES.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        <input name="query" defaultValue={filters.query ?? ''} placeholder="Tên hoặc mã" className={INPUT_CLASS} />
        <button type="submit" className={adminButtonClass('secondary')}>
          Lọc
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Đã thu" value={formatVndCompact(totals.collected)} />
        <StatCard label="Còn nợ" value={formatVndCompact(totals.outstanding)} tone="alert" />
        <StatCard label="Đã miễn" value={formatVndCompact(totals.waived)} />
      </div>

      <details className="mt-4 rounded-lg border border-hairline bg-white p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-bold">Thêm phạt tay</summary>
        <ActionForm action={addManualPenalties} className="flex flex-col gap-2 pb-2">
          <select name="member_ids" multiple size={8} className={INPUT_CLASS} aria-label="Chọn thành viên">
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name} ({member.member_code})
              </option>
            ))}
          </select>
          <select name="type_code" className={INPUT_CLASS} defaultValue="event_absent">
            {PENALTY_TYPES.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            min={1000}
            step={1000}
            placeholder="Số tiền (đ)"
            required
            className={INPUT_CLASS}
          />
          <input name="reason" placeholder="Lý do, ví dụ: vắng chạy chung 12/11" className={INPUT_CLASS} />
          <button type="submit" className={adminButtonClass('primary')}>
            Thêm
          </button>
        </ActionForm>
      </details>

      <details className="mt-2 rounded-lg border border-hairline bg-white p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-bold">Tài khoản nhận phạt</summary>
        <ActionForm action={saveFundSettings} className="flex flex-col gap-2 pb-2">
          <input name="bank_name" defaultValue={fund.bankName} placeholder="Ngân hàng" className={INPUT_CLASS} />
          <input
            name="account_number"
            defaultValue={fund.accountNumber}
            placeholder="Số tài khoản"
            className={INPUT_CLASS}
          />
          <input
            name="account_holder"
            defaultValue={fund.accountHolder}
            placeholder="Chủ tài khoản"
            className={INPUT_CLASS}
          />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="totals_public" defaultChecked={fund.totalsPublic} className="size-5" />
            Công khai tổng phạt theo người cho cả CLB (không kèm lý do)
          </label>
          <button type="submit" className={adminButtonClass('secondary')}>
            Lưu
          </button>
        </ActionForm>
      </details>

      <h2 className="mt-6 mb-2 text-lg font-black">Chưa nộp ({open.window.total})</h2>
      <ActionForm action={applyPenaltySelection} className="flex flex-col gap-3">
        <DataTable columns={OPEN_COLUMNS} rows={open.rows} rowKey={(row) => row.id} emptyText="Không có khoản nào chưa nộp." />
        <Pagination
          window={open.window}
          hrefFor={(page) => hrefWithPage('/admin/penalties', { ...rawParams, openPage: undefined, ...(page > 1 ? { openPage: String(page) } : {}) }, 1)}
          unit="khoản"
        />
        {open.window.total > 0 && (
          <AdminCard title="Áp dụng cho các khoản đã chọn">
            <div className="grid gap-2 md:grid-cols-3">
              <select name="method" className={INPUT_CLASS} defaultValue="cash">
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input name="payment_ref" placeholder="Mã giao dịch (nếu có)" className={INPUT_CLASS} />
              <input name="reason" placeholder="Lý do miễn (chỉ khi bấm Miễn)" className={INPUT_CLASS} />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" name="intent" value="paid" className={`${adminButtonClass('primary')} flex-1 md:flex-none`}>
                Đã nộp
              </button>
              <button type="submit" name="intent" value="waive" className={`${adminButtonClass('secondary')} flex-1 md:flex-none`}>
                Miễn
              </button>
            </div>
          </AdminCard>
        )}
      </ActionForm>

      <h2 className="mt-6 mb-2 text-lg font-black">Đã xử lý ({closed.window.total})</h2>
      <DataTable columns={CLOSED_COLUMNS} rows={closed.rows} rowKey={(row) => row.id} emptyText="Chưa có khoản nào." />
      <Pagination
        window={closed.window}
        hrefFor={(page) => hrefWithPage('/admin/penalties', { ...rawParams, closedPage: undefined, ...(page > 1 ? { closedPage: String(page) } : {}) }, 1)}
        unit="khoản"
      />
    </section>
  )
}
