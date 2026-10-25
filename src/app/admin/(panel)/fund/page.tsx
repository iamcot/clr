import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Pagination from '@/components/admin/Pagination'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import FundQueue from '@/components/FundQueue'
import FundTransactionsList from '@/components/FundTransactionsList'
import { BankAccountForm, ManualTransactionForm, ReconciliationForm } from '@/components/FundForms'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatVndCompact } from '@/lib/format/money'
import { loadAdminFund } from '@/lib/fund/loadAdminFund'

const TABS = ['overview', 'manual', 'reconcile', 'account'] as const

export default async function AdminFundPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  await requireBcn()
  const query = await searchParams
  const data = await loadAdminFund()
  const tab = pickTab(TABS, query.tab, 'overview')
  const total = data.balances.reduce((sum, balance) => sum + balance.balance, 0)
  const bankAccount = data.accounts.find((account) => account.kind === 'bank')
  const queueCount = data.queue.length + data.cashRequests.length
  const paged = slicePage(data.transactions, parsePage(query.page))

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Tổng số dư" value={formatVndCompact(total)} />
        {data.balances.map((balance) => (
          <StatCard key={balance.accountId} label={balance.name} value={formatVndCompact(balance.balance)} />
        ))}
      </div>

      <div className="mt-4">
        <AdminTabs
          items={[
            { href: '/admin/fund', label: queueCount > 0 ? `Tổng quan (${queueCount} cần xử lý)` : 'Tổng quan', active: tab === 'overview' },
            { href: '/admin/fund?tab=manual', label: 'Thu chi thủ công', active: tab === 'manual' },
            { href: '/admin/fund?tab=reconcile', label: 'Đối soát sao kê', active: tab === 'reconcile' },
            { href: '/admin/fund?tab=account', label: 'Tài khoản nhận tiền', active: tab === 'account' },
          ]}
        />
      </div>

      <div className="mt-4">
        {tab === 'overview' && (
          <div className="flex flex-col gap-4">
            <FundQueue
              queue={data.queue}
              openIntents={data.openIntents}
              cashRequests={data.cashRequests}
              categories={data.categories}
            />
            <div>
              <h2 className="mb-2 text-lg font-black">Giao dịch gần đây</h2>
              <FundTransactionsList rows={paged.rows} />
              <Pagination window={paged.window} hrefFor={(page) => hrefWithPage('/admin/fund', query, page)} unit="giao dịch" />
            </div>
          </div>
        )}
        {tab === 'manual' && <ManualTransactionForm accounts={data.accounts} categories={data.categories} />}
        {tab === 'reconcile' && <ReconciliationForm accounts={data.accounts} history={data.reconciliations} />}
        {tab === 'account' && <BankAccountForm account={bankAccount} />}
      </div>
    </section>
  )
}
