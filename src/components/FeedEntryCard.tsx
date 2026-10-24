'use client'

import Link from 'next/link'
import PostCard from '@/components/PostCard'
import { HONOR_KIND_ICONS } from '@/config/hallOfFame'
import type { FeedEntry } from '@/lib/feed/mergeFeed'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatRelativeVi } from '@/lib/format/relativeTime'
import type { HighlightKind } from '@/lib/members/highlights'

const KIND_ICONS: Record<HighlightKind, string> = {
  pr: '⚡',
  honor: HONOR_KIND_ICONS.special,
  race: '🎽',
}

function When({ iso }: { iso: string }) {
  const text = formatRelativeVi(iso, new Date()) ?? formatDateVi(iso)
  return (
    <p className="text-xs text-muted" suppressHydrationWarning>
      {text}
    </p>
  )
}

function SmallEntry({ icon, memberId, memberName, text, at }: { icon: string; memberId: string; memberName: string; text: string; at: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 text-sm shadow-sm">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p>
          <Link href={`/members/${memberId}`} className="font-bold">
            {memberName}
          </Link>{' '}
          {text}
        </p>
        <When iso={at} />
      </div>
    </li>
  )
}

export default function FeedEntryCard({ entry, memberView }: { entry: FeedEntry; memberView: boolean }) {
  if (entry.kind === 'post') return <PostCard post={entry.post} memberView={memberView} />
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
