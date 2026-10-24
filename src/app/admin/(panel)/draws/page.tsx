import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import { adminButtonClass } from '@/components/admin/styles'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { DRAW_STATUS_LABELS } from '@/config/draw'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadDrawList } from '@/lib/draw/loadDraw'

type DrawRow = Awaited<ReturnType<typeof loadDrawList>>[number]

const COLUMNS: DataTableColumn<DrawRow>[] = [
  { key: 'title', header: 'Đợt quay số', isLink: true, cell: (draw) => draw.title },
  { key: 'status', header: 'Trạng thái', cell: (draw) => <Badge tone="info">{DRAW_STATUS_LABELS[draw.status]}</Badge> },
  { key: 'created', header: 'Tạo lúc', hideBelowMd: true, cell: (draw) => formatDateTimeVi(draw.createdAt) },
]

export default async function AdminDrawsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireBcn()
  const params = await searchParams
  const { rows: draws, window } = slicePage(await loadDrawList(), parsePage(params.page))

  return (
    <section>
      <AdminPageHeader
        title="Quay số"
        description="Quay số trúng thưởng trực tiếp"
        actions={
          <Link href="/admin/draws/new" className={adminButtonClass('primary')}>
            + Tạo đợt quay số
          </Link>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={draws}
        rowKey={(draw) => draw.id}
        rowHref={(draw) => `/admin/draws/${draw.id}`}
        emptyText="Chưa có đợt quay số nào."
      />
      <Pagination window={window} hrefFor={(page) => hrefWithPage('/admin/draws', params, page)} unit="đợt quay" />
    </section>
  )
}
