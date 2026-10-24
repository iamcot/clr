import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { adminButtonClass } from '@/components/admin/styles'
import { LEVEL_RULES } from '@/config/levels'
import { recomputeStatsAndLevels } from '@/lib/stats/adminStatsActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const maxDuration = 300

async function loadLevelCounts(): Promise<Map<number, number>> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members').select('level').eq('status', 'active')
  const counts = new Map<number, number>()
  for (const row of data ?? []) counts.set(row.level, (counts.get(row.level) ?? 0) + 1)
  return counts
}

type LevelRow = { level: number; name: string; count: number }

const COLUMNS: DataTableColumn<LevelRow>[] = [
  { key: 'level', header: 'Level', cell: (row) => `Level ${row.level}` },
  { key: 'name', header: 'Tên', cell: (row) => row.name },
  { key: 'count', header: 'Số người', align: 'right', cell: (row) => <b>{row.count}</b> },
]

export default async function AdminStatsPage() {
  const counts = await loadLevelCounts()
  const rows = LEVEL_RULES.map((rule) => ({ level: rule.level, name: rule.name, count: counts.get(rule.level) ?? 0 }))

  return (
    <section>
      <AdminPageHeader
        title="Thống kê và level"
        description="Hệ thống tự tính lại sau mỗi lần hoạt động đổi và mỗi đêm."
      />
      <DataTable columns={COLUMNS} rows={rows} rowKey={(row) => String(row.level)} />
      <AdminCard title="Tính lại ngay" className="mt-4">
        <p className="mb-3 text-sm text-muted">
          Sau khi sửa điều kiện level trong code, bấm nút này để áp dụng cho mọi người.
        </p>
        <ActionForm action={recomputeStatsAndLevels}>
          <button type="submit" className={adminButtonClass('primary')}>
            Tính lại thống kê và level
          </button>
        </ActionForm>
      </AdminCard>
    </section>
  )
}
