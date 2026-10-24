import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import FundQueue from '@/components/FundQueue'
import FundTransactionsList from '@/components/FundTransactionsList'
import { BankAccountForm, ManualTransactionForm, ReconciliationForm } from '@/components/FundForms'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatVnd } from '@/lib/format/money'
import { loadAdminFund } from '@/lib/fund/loadAdminFund'

export default async function AdminFundPage() {
  await requireBcn()
  const data = await loadAdminFund()
  const total = data.balances.reduce((sum, balance) => sum + balance.balance, 0)
  const bankAccount = data.accounts.find((account) => account.kind === 'bank')

  return (
    <section>
      <AdminPageHeader
        title="Quỹ"
        description="Sổ quỹ, đối soát chuyển khoản và thu chi"
        actions={
          <Link href="/admin/fund/reports" className={adminButtonClass('secondary')}>
            Báo cáo, chốt sổ và xuất file
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Tổng số dư" value={formatVnd(total)} />
        {data.balances.map((balance) => (
          <StatCard key={balance.accountId} label={balance.name} value={formatVnd(balance.balance)} />
        ))}
      </div>
      <FundQueue queue={data.queue} openIntents={data.openIntents} cashRequests={data.cashRequests} categories={data.categories} />
      <FundTransactionsList rows={data.transactions} />
      <ManualTransactionForm accounts={data.accounts} categories={data.categories} />
      <ReconciliationForm accounts={data.accounts} history={data.reconciliations} />
      <BankAccountForm account={bankAccount} />
    </section>
  )
}
