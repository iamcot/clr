import ActionForm from '@/components/ActionForm'
import ImageField from '@/components/ImageField'
import { BANKS, FUND_DIRECTION_LABELS } from '@/config/fund'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVnd } from '@/lib/format/money'
import { addFundTransaction, recordFundReconciliation, saveFundAccount } from '@/lib/fund/adminActions'
import type { FundAccount, FundCategory, ReconciliationRow } from '@/lib/fund/loadAdminFund'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const SUBMIT_CLASS = 'min-h-12 rounded-full bg-brand font-bold text-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-bold">{label}</span>
      {children}
    </label>
  )
}

export function BankAccountForm({ account }: { account: FundAccount | undefined }) {
  return (
    <details className="mt-6 rounded-lg bg-white p-3 shadow-sm" open={!account?.accountNo}>
      <summary className="min-h-11 cursor-pointer py-3 text-lg font-black">Tài khoản nhận tiền của quỹ</summary>
      <ActionForm action={saveFundAccount} className="flex flex-col gap-3">
        <Field label="Ngân hàng">
          <select name="bank_bin" defaultValue={account?.bankBin ?? ''} required className={INPUT_CLASS}>
            <option value="" disabled>
              Chọn ngân hàng
            </option>
            {BANKS.map((bank) => (
              <option key={bank.bin} value={bank.bin}>
                {bank.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Số tài khoản">
          <input name="account_no" defaultValue={account?.accountNo ?? ''} required inputMode="numeric" className={INPUT_CLASS} />
        </Field>
        <Field label="Tên chủ tài khoản">
          <input name="account_name" defaultValue={account?.accountName ?? ''} required className={INPUT_CLASS} />
        </Field>
        <button type="submit" className={SUBMIT_CLASS}>
          Lưu tài khoản
        </button>
      </ActionForm>
    </details>
  )
}

export function ManualTransactionForm({ accounts, categories }: { accounts: FundAccount[]; categories: FundCategory[] }) {
  return (
    <details className="mt-6 rounded-lg bg-white p-3 shadow-sm">
      <summary className="min-h-11 cursor-pointer py-3 text-lg font-black">Thêm thu, chi thủ công</summary>
      <ActionForm action={addFundTransaction} className="flex flex-col gap-3">
        <Field label="Tài khoản">
          <select name="account_id" defaultValue={accounts[0]?.id ?? ''} required className={INPUT_CLASS}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Danh mục">
          <select name="category_id" defaultValue="" required className={INPUT_CLASS}>
            <option value="" disabled>
              Chọn danh mục
            </option>
            {(['in', 'out'] as const).map((direction) => (
              <optgroup key={direction} label={FUND_DIRECTION_LABELS[direction]}>
                {categories
                  .filter((category) => category.direction === direction)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {FUND_DIRECTION_LABELS[direction]} · {category.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Số tiền (đ)">
          <input name="amount" required inputMode="numeric" placeholder="1.500.000" className={INPUT_CLASS} />
        </Field>
        <Field label="Thời điểm (để trống là bây giờ)">
          <input name="occurred_at" type="datetime-local" className={INPUT_CLASS} />
        </Field>
        <Field label="Nội dung">
          <input name="description" maxLength={300} className={INPUT_CLASS} />
        </Field>
        <div>
          <p className="text-sm font-bold">Ảnh hoá đơn</p>
          <ImageField name="receipt_url" purpose="receipt" />
          <label className="mt-2 flex min-h-11 items-center gap-3">
            <input type="checkbox" name="receipt_public" className="size-5 accent-brand" />
            <span className="text-sm">Cho thành viên xem ảnh hoá đơn này</span>
          </label>
        </div>
        <button type="submit" className={SUBMIT_CLASS}>
          Ghi giao dịch
        </button>
      </ActionForm>
    </details>
  )
}

export function ReconciliationForm({ accounts, history }: { accounts: FundAccount[]; history: ReconciliationRow[] }) {
  return (
    <details className="mt-6 rounded-lg bg-white p-3 shadow-sm">
      <summary className="min-h-11 cursor-pointer py-3 text-lg font-black">Đối chiếu với sao kê</summary>
      <ActionForm action={recordFundReconciliation} className="flex flex-col gap-3">
        <Field label="Tài khoản">
          <select name="account_id" defaultValue={accounts[0]?.id ?? ''} required className={INPUT_CLASS}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Số dư theo sao kê vào cuối ngày">
          <input name="as_of" type="date" required className={INPUT_CLASS} />
        </Field>
        <Field label="Số dư theo sao kê (đ)">
          <input name="statement_balance" required inputMode="numeric" className={INPUT_CLASS} />
        </Field>
        <Field label="Ghi chú">
          <input name="note" maxLength={200} className={INPUT_CLASS} />
        </Field>
        <button type="submit" className={SUBMIT_CLASS}>
          Đối chiếu
        </button>
      </ActionForm>
      {history.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {history.map((row) => (
            <li key={row.id} className="flex justify-between gap-2 border-t border-line pt-1">
              <span>
                {formatDateVi(`${row.asOf}T00:00:00+07:00`)} · {row.accountName}
              </span>
              <span className={row.difference === 0 ? 'font-bold text-brand-dark' : 'font-bold text-danger'}>
                {row.difference === 0 ? 'Khớp' : `Lệch ${formatVnd(Math.abs(row.difference))}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
