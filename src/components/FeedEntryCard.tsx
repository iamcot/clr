'use client'

import Link from 'next/link'
import PostCard from '@/components/PostCard'
import { HONOR_KIND_ICONS } from '@/config/hallOfFame'
import type { FeedEntry } from '@/lib/feed/mergeFeed'
import { formatDateTimeVi, formatDateVi } from '@/lib/format/dateTime'
import { formatRelativeVi } from '@/lib/format/relativeTime'
import { formatFixed } from '@/lib/format/number'
import type { HighlightKind } from '@/lib/members/highlights'

const KIND_ICONS: Record<HighlightKind, string> = {
  pr: '⚡',
  honor: HONOR_KIND_ICONS.special,
  race: '🎽',
}

const RUN_ICON = '🏃'

function When({ iso }: { iso: string }) {
  const text = formatRelativeVi(iso, new Date()) ?? formatDateVi(iso)
  return (
    <p className="text-xs text-muted" suppressHydrationWarning>
      {text}
    </p>
  )
}

function SmallEntry({ icon, memberId, memberName, text, at }: { icon: string; memberId?: string; memberName: string; text: string; at: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 text-sm shadow-sm">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p>
          {memberId ? (
            <Link href={`/members/${memberId}`} className="font-bold">
              {memberName}
            </Link>
          ) : (
            <span className="font-bold">{memberName}</span>
          )}{' '}
          {text}
        </p>
        <When iso={at} />
      </div>
    </li>
  )
}

export default function FeedEntryCard({ entry }: { entry: FeedEntry }) {
  if (entry.kind === 'post') return <PostCard post={entry.post} />
  if (entry.kind === 'highlight') {
    const { highlight } = entry
    return (
      <SmallEntry
        icon={KIND_ICONS[highlight.kind]}
        memberId={highlight.memberId}
        memberName={highlight.memberName}
        text={highlight.text}
        at={entry.at}
      />
    )
  }
  return (
    <SmallEntry
      icon={RUN_ICON}
      memberName={entry.run.friendName}
      text={`chạy ${formatFixed(entry.run.distanceMeters / 1000, 2)} km · ${formatDateTimeVi(entry.run.startDate)}`}
      at={entry.at}
    />
  )
}
