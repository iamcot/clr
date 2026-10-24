import Link from 'next/link'
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
      <h1 className="text-2xl font-black">Quỹ</h1>
      <div className="mt-3 rounded-2xl bg-deep p-4 text-white">
        <p className="text-sm text-white/70">Tổng số dư</p>
        <p className="text-3xl font-black">{formatVnd(total)}</p>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {data.balances.map((balance) => (
            <li key={balance.accountId} className="flex justify-between gap-2">
              <span className="text-white/80">{balance.name}</span>
              <span className="font-bold">{formatVnd(balance.balance)}</span>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href="/admin/fund/reports"
        className="mt-3 flex min-h-12 items-center justify-center rounded-lg border border-line bg-white font-bold"
      >
        Báo cáo, chốt sổ và xuất file
      </Link>
      <FundQueue queue={data.queue} openIntents={data.openIntents} cashRequests={data.cashRequests} categories={data.categories} />
      <FundTransactionsList rows={data.transactions} />
      <ManualTransactionForm accounts={data.accounts} categories={data.categories} />
      <ReconciliationForm accounts={data.accounts} history={data.reconciliations} />
      <BankAccountForm account={bankAccount} />
    </section>
  )
}
