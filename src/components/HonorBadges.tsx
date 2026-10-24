import { HONOR_KIND_ICONS } from '@/config/hallOfFame'
import { formatDateVi } from '@/lib/format/dateTime'
import type { HonorView } from '@/lib/hallOfFame/loadHonors'

export default function HonorBadges({ honors }: { honors: HonorView[] }) {
  if (honors.length === 0) return null
  return (
    <div className="mt-6">
      <h2 className="text-lg font-black">Danh hiệu</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {honors.map((honor) => (
          <li key={honor.id} className="rounded-lg bg-white shadow-sm">
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center gap-3 p-3">
                <span className="text-2xl" aria-hidden>
                  {HONOR_KIND_ICONS[honor.kind]}
                </span>
                <span className="font-bold">{honor.title}</span>
              </summary>
              <div className="px-3 pb-3 text-sm text-muted">
                {honor.detail && <p>{honor.detail}</p>}
                <p>{formatDateVi(`${honor.date}T00:00:00+07:00`)}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}
