import ActionForm from '@/components/ActionForm'
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

export default async function AdminStatsPage() {
  const counts = await loadLevelCounts()

  return (
    <section>
      <h1 className="text-2xl font-black">Thống kê và level</h1>
      <p className="mt-1 text-sm text-muted">
        Hệ thống tự tính lại sau mỗi lần hoạt động đổi và mỗi đêm. Sau khi sửa điều kiện level trong code, bấm nút dưới
        để áp dụng ngay.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {LEVEL_RULES.map((rule) => (
          <li key={rule.level} className="flex justify-between rounded-lg bg-white p-3">
            <span>
              Level {rule.level} · {rule.name}
            </span>
            <strong>{counts.get(rule.level) ?? 0} người</strong>
          </li>
        ))}
      </ul>
      <ActionForm action={recomputeStatsAndLevels} className="mt-4">
        <button type="submit" className="min-h-12 w-full rounded-lg bg-brand font-bold text-white active:bg-brand-dark">
          Tính lại thống kê và level cho mọi người
        </button>
      </ActionForm>
    </section>
  )
}
