import Link from 'next/link'

export type DataTableColumn<Row> = {
  key: string
  header: string
  cell: (row: Row) => React.ReactNode
  hideBelowMd?: boolean
  isLink?: boolean
  align?: 'left' | 'right'
}

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  rowHref?: (row: Row) => string
  emptyText?: string
}

function cellClass<Row>(column: DataTableColumn<Row>, extra = ''): string {
  const visibility = column.hideBelowMd ? 'hidden md:table-cell' : ''
  const align = column.align === 'right' ? 'text-right' : 'text-left'
  return `${visibility} ${align} px-3 py-1.5 align-middle ${extra}`
}

export default function DataTable<Row>({ columns, rows, rowKey, rowHref, emptyText }: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <p className="rounded-md border border-dashed border-line bg-white p-6 text-center text-muted">{emptyText ?? 'Chưa có dữ liệu.'}</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-xs font-bold text-muted">
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cellClass(column, 'font-bold')}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row)
            return (
              <tr key={rowKey(row)} className="border-b border-line last:border-b-0 md:hover:bg-surface/70">
                {columns.map((column) => (
                  <td key={column.key} className={cellClass(column)}>
                    {column.isLink && href ? (
                      <Link href={href} className="flex min-h-8 items-center font-bold">
                        {column.cell(row)}
                      </Link>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
