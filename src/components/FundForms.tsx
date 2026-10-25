import ActionForm from '@/components/ActionForm'
import DateInput from '@/components/admin/DateInput'
import AdminFormSection from '@/components/admin/AdminFormSection'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import FormField from '@/components/admin/FormField'
import StickyActionBar from '@/components/admin/StickyActionBar'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import ImageField from '@/components/ImageField'
import { BANKS, FUND_DIRECTION_LABELS } from '@/config/fund'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatVndCompact } from '@/lib/format/money'
import { addFundTransaction, recordFundReconciliation, saveFundAccount } from '@/lib/fund/adminActions'
import type { FundAccount, FundCategory, ReconciliationRow } from '@/lib/fund/loadAdminFund'

const INPUT_CLASS = ADMIN_INPUT_CLASS

export function BankAccountForm({ account }: { account: FundAccount | undefined }) {
  return (
    <ActionForm action={saveFundAccount} className="flex flex-col gap-4">
      <AdminFormSection columns={2} title="Tài khoản nhận tiền của quỹ" description="Dùng để tạo mã VietQR cho thành viên nộp quỹ.">
        <FormField label="Ngân hàng">
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
        </FormField>
        <FormField label="Số tài khoản">
          <input name="account_no" defaultValue={account?.accountNo ?? ''} required inputMode="numeric" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Tên chủ tài khoản">
          <input name="account_name" defaultValue={account?.accountName ?? ''} required className={INPUT_CLASS} />
        </FormField>
      </AdminFormSection>
      <StickyActionBar>
        <button type="submit" className={adminButtonClass('primary')}>
          Lưu tài khoản
        </button>
      </StickyActionBar>
    </ActionForm>
  )
}

export function ManualTransactionForm({ accounts, categories }: { accounts: FundAccount[]; categories: FundCategory[] }) {
  return (
    <ActionForm action={addFundTransaction} className="flex flex-col gap-4">
      <AdminFormSection columns={2} title="Thêm thu, chi thủ công">
        <FormField label="Tài khoản">
          <select name="account_id" defaultValue={accounts[0]?.id ?? ''} required className={INPUT_CLASS}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Danh mục">
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
        </FormField>
        <FormField label="Số tiền (đ)">
          <input name="amount" required inputMode="numeric" placeholder="1.500.000" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Thời điểm (để trống là bây giờ)">
          <DateInput name="occurred_at" type="datetime-local" />
        </FormField>
        <FormField label="Nội dung">
          <input name="description" maxLength={300} className={INPUT_CLASS} />
        </FormField>
        <div className="md:col-span-2">
          <p className="text-sm font-bold">Ảnh hoá đơn</p>
          <ImageField name="receipt_url" purpose="receipt" />
          <label className="mt-2 flex min-h-10 items-center gap-3">
            <input type="checkbox" name="receipt_public" className="size-5 accent-brand" />
            <span className="text-sm">Cho thành viên xem ảnh hoá đơn này</span>
          </label>
        </div>
      </AdminFormSection>
      <StickyActionBar>
        <button type="submit" className={adminButtonClass('primary')}>
          Ghi giao dịch
        </button>
      </StickyActionBar>
    </ActionForm>
  )
}

const RECONCILIATION_COLUMNS: DataTableColumn<ReconciliationRow>[] = [
  { key: 'date', header: 'Ngày', cell: (row) => formatDateVi(`${row.asOf}T00:00:00+07:00`) },
  { key: 'account', header: 'Tài khoản', hideBelowMd: true, cell: (row) => row.accountName },
  {
    key: 'diff',
    header: 'Kết quả',
    align: 'right',
    cell: (row) => (
      <b className={row.difference === 0 ? 'text-brand-dark' : 'text-danger'}>
        {row.difference === 0 ? 'Khớp' : `Lệch ${formatVndCompact(Math.abs(row.difference))}`}
      </b>
    ),
  },
]

export function ReconciliationForm({ accounts, history }: { accounts: FundAccount[]; history: ReconciliationRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <ActionForm action={recordFundReconciliation} className="flex flex-col gap-4">
        <AdminFormSection columns={2} title="Đối chiếu với sao kê">
        <FormField label="Tài khoản">
          <select name="account_id" defaultValue={accounts[0]?.id ?? ''} required className={INPUT_CLASS}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Số dư theo sao kê vào cuối ngày">
          <DateInput name="as_of" type="date" required />
        </FormField>
        <FormField label="Số dư theo sao kê (đ)">
          <input name="statement_balance" required inputMode="numeric" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Ghi chú">
          <input name="note" maxLength={200} className={INPUT_CLASS} />
        </FormField>
        </AdminFormSection>
        <StickyActionBar>
          <button type="submit" className={adminButtonClass('primary')}>
            Đối chiếu
          </button>
        </StickyActionBar>
      </ActionForm>
      <DataTable
        columns={RECONCILIATION_COLUMNS}
        rows={history}
        rowKey={(row) => row.id}
        emptyText="Chưa có lần đối chiếu nào."
      />
    </div>
  )
}
