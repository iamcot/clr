import Link from 'next/link'
import { HONOR_KIND_ICONS } from '@/config/hallOfFame'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatRelativeVi } from '@/lib/format/relativeTime'
import type { HighlightItem, HighlightKind } from '@/lib/members/highlights'

function whenText(item: HighlightItem, now: Date): string {
  const iso = item.date.length === 10 ? `${item.date}T00:00:00+07:00` : item.date
  return formatRelativeVi(iso, now) ?? formatDateVi(iso)
}

const KIND_ICONS: Record<HighlightKind, string> = {
  pr: '⚡',
  honor: HONOR_KIND_ICONS.special,
  race: '🎽',
}

export default function FollowingHighlights({ items, now }: { items: HighlightItem[]; now: Date }) {
  if (items.length === 0) return null
  return (
    <div className="mt-6">
      <h2 className="text-xl font-black">Người bạn theo dõi có tin mới</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 text-sm shadow-sm">
            <span className="text-xl" aria-hidden>
              {KIND_ICONS[item.kind]}
            </span>
            <div className="min-w-0">
              <p>
                <Link href={`/members/${item.memberId}`} className="font-bold">
                  {item.memberName}
                </Link>{' '}
                {item.text}
              </p>
              <p className="text-xs text-muted">{whenText(item, now)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
