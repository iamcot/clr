import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { PAYMENT_METHOD_LABELS, PENALTY_STATUS_LABELS, PENALTY_TYPES, type PenaltyStatus } from '@/config/penalties'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'
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

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const BUTTON_CLASS = 'min-h-11 rounded-lg border border-line bg-white px-4 font-bold'
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

function PenaltyLine({ row }: { row: PenaltyListRow }) {
  return (
    <>
      <p className="font-bold">
        {row.memberName} <span className="font-normal text-muted">{row.memberCode}</span>
      </p>
      <p className="text-sm">
        {formatVnd(row.amount)} · {row.typeName}
      </p>
      <p className="text-xs text-muted">
        {formatDateVi(row.createdAt)} · {row.reason}
      </p>
    </>
  )
}

function ClosedPenalty({ row }: { row: PenaltyListRow }) {
  return (
    <li className="rounded-lg bg-white shadow-sm p-3">
      <PenaltyLine row={row} />
      <p className="text-xs text-muted">
        {PENALTY_STATUS_LABELS[row.status]}
        {row.paidMethod &&
          ` · ${PAYMENT_METHOD_LABELS[row.paidMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? row.paidMethod}`}
        {row.paymentRef && ` · ${row.paymentRef}`}
        {row.waivedReason && ` · ${row.waivedReason}`}
      </p>
      {row.status === 'paid' && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-brand-dark">
            Huỷ trạng thái nộp
          </summary>
          <ActionForm action={unmarkPenaltyPaid} className="flex flex-col gap-2 pb-2">
            <input type="hidden" name="id" value={row.id} />
            <input name="reason" placeholder="Lý do (bắt buộc)" required className={INPUT_CLASS} />
            <button type="submit" className={BUTTON_CLASS}>
              Chuyển về chưa nộp
            </button>
          </ActionForm>
        </details>
      )}
    </li>
  )
}

export default async function AdminPenaltiesPage({ searchParams }: { searchParams: Promise<PenaltyFilters> }) {
  const filters = await searchParams
  const month = filters.month ?? currentMonthVn(new Date())
  const effective = { ...filters, month }
  const [rows, members, fund] = await Promise.all([loadPenalties(effective), loadActiveMembers(), loadFundSettings()])
  const totals = summarizePenalties(rows)
  const open = rows.filter((row) => row.status === 'unpaid')
  const closed = rows.filter((row) => row.status !== 'unpaid')
  const csvQuery = new URLSearchParams({
    month,
    status: filters.status ?? '',
    type: filters.typeCode ?? '',
  })

  return (
    <section>
      <h1 className="text-2xl font-black">Thưởng phạt</h1>
      <div className="mt-2 flex gap-2">
        <Link href="/admin/rewards" className={`${BUTTON_CLASS} flex flex-1 items-center justify-center`}>
          Danh sách thưởng
        </Link>
        <Link
          href={`/admin/penalties/csv?${csvQuery.toString()}`}
          prefetch={false}
          className={`${BUTTON_CLASS} flex flex-1 items-center justify-center`}
        >
          Xuất CSV
        </Link>
      </div>

      <form method="get" className="mt-3 grid grid-cols-2 gap-2">
        <input name="month" type="month" defaultValue={month} className={INPUT_CLASS} />
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
        <button type="submit" className={`${BUTTON_CLASS} col-span-2`}>
          Lọc
        </button>
      </form>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white shadow-sm p-2">
          <dt className="text-xs text-muted">Đã thu</dt>
          <dd className="font-black">{formatVnd(totals.collected)}</dd>
        </div>
        <div className="rounded-lg bg-white shadow-sm p-2">
          <dt className="text-xs text-muted">Còn nợ</dt>
          <dd className="font-black text-danger">{formatVnd(totals.outstanding)}</dd>
        </div>
        <div className="rounded-lg bg-white shadow-sm p-2">
          <dt className="text-xs text-muted">Đã miễn</dt>
          <dd className="font-black">{formatVnd(totals.waived)}</dd>
        </div>
      </dl>

      <details className="mt-4 rounded-lg bg-white shadow-sm p-3">
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
          <button type="submit" className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark">
            Thêm
          </button>
        </ActionForm>
      </details>

      <details className="mt-2 rounded-lg bg-white shadow-sm p-3">
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
          <button type="submit" className={BUTTON_CLASS}>
            Lưu
          </button>
        </ActionForm>
      </details>

      <h2 className="mt-6 text-lg font-black">Chưa nộp ({open.length})</h2>
      {open.length > 0 && (
        <ActionForm action={applyPenaltySelection} className="mt-2 flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {open.map((row) => (
              <li key={row.id} className="rounded-lg bg-white shadow-sm">
                <label className="flex min-h-11 items-start gap-3 p-3">
                  <input type="checkbox" name="ids" value={row.id} className="mt-1 size-5" />
                  <span className="min-w-0 flex-1">
                    <PenaltyLine row={row} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-white shadow-sm p-3">
            <p className="text-sm font-bold">Áp dụng cho các khoản đã chọn</p>
            <select name="method" className={`${INPUT_CLASS} mt-2`} defaultValue="cash">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input name="payment_ref" placeholder="Mã giao dịch (nếu có)" className={`${INPUT_CLASS} mt-2`} />
            <input name="reason" placeholder="Lý do miễn (chỉ khi bấm Miễn)" className={`${INPUT_CLASS} mt-2`} />
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                name="intent"
                value="paid"
                className="min-h-12 flex-1 rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
              >
                Đã nộp
              </button>
              <button type="submit" name="intent" value="waive" className={`${BUTTON_CLASS} flex-1`}>
                Miễn
              </button>
            </div>
          </div>
        </ActionForm>
      )}

      <h2 className="mt-6 text-lg font-black">Đã xử lý ({closed.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {closed.map((row) => (
          <ClosedPenalty key={row.id} row={row} />
        ))}
      </ul>
    </section>
  )
}
