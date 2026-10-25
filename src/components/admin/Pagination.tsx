import Link from 'next/link'
import type { PageWindow } from '@/lib/admin/pagination'
import { formatNumber } from '@/lib/format/number'

type PaginationProps = { window: PageWindow; hrefFor: (page: number) => string; unit?: string }

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const className = 'flex min-h-9 items-center rounded-lg border border-hairline bg-white px-3 text-sm font-bold'
  if (disabled) return <span className={`${className} pointer-events-none opacity-40`}>{children}</span>
  return (
    <Link href={href} className={`${className} active:bg-surface md:hover:border-brand`}>
      {children}
    </Link>
  )
}

export default function Pagination({ window, hrefFor, unit = 'mục' }: PaginationProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
      <span>
        Tổng <b className="text-ink">{formatNumber(window.total)}</b> {unit}
      </span>
      {window.totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-2">
          <PageLink href={hrefFor(window.page - 1)} disabled={window.page <= 1}>
            ← Trước
          </PageLink>
          <span>
            {window.page}/{window.totalPages}
          </span>
          <PageLink href={hrefFor(window.page + 1)} disabled={window.page >= window.totalPages}>
            Sau →
          </PageLink>
        </nav>
      )}
    </div>
  )
}
