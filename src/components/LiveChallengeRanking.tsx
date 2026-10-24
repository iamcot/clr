'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export type LiveRankingRow = {
  memberId: string
  name: string
  categoryId: string
  valueText: string
  progressPct: number
  completed: boolean
  rank: number | null
}

type LiveChallengeRankingProps = {
  challengeId: string
  categories: { id: string; name: string }[]
  rows: LiveRankingRow[]
  myMemberId: string
  followingIds: string[]
}

const REFRESH_DEBOUNCE_MS = 1500

function useRefreshOnEntryChange(challengeId: string) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_entries',
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS)
        },
      )
      .subscribe()
    return () => {
      if (timer.current) clearTimeout(timer.current)
      void supabase.removeChannel(channel)
    }
  }, [challengeId, router])
}

function RankingLine({ row, mine }: { row: LiveRankingRow; mine: boolean }) {
  return (
    <li className={`flex items-center gap-3 rounded-lg p-3 ${mine ? 'bg-lime/30' : 'bg-white'}`}>
      <span className="w-8 text-center font-black">{row.rank ?? '-'}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {row.name}
          {row.completed && <span className="ml-1 text-brand-dark">✓</span>}
        </p>
        <p className="text-xs text-muted">{Math.round(row.progressPct)}%</p>
      </div>
      <span className="font-black">{row.valueText}</span>
    </li>
  )
}

export default function LiveChallengeRanking({
  challengeId,
  categories,
  rows,
  myMemberId,
  followingIds,
}: LiveChallengeRankingProps) {
  useRefreshOnEntryChange(challengeId)
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [onlyFollowing, setOnlyFollowing] = useState(false)

  const visibleRows = useMemo(() => {
    const following = new Set(followingIds)
    return rows
      .filter((row) => row.categoryId === categoryId)
      .filter((row) => !onlyFollowing || row.memberId === myMemberId || following.has(row.memberId))
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
  }, [rows, categoryId, onlyFollowing, followingIds, myMemberId])
  const myRow = visibleRows.find((row) => row.memberId === myMemberId)

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-bold ${
                category.id === categoryId ? 'bg-brand text-white' : 'bg-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
      <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyFollowing} onChange={(event) => setOnlyFollowing(event.target.checked)} />
        Chỉ người tôi theo dõi
      </label>
      {myRow && (
        <ul className="mt-1 mb-2">
          <RankingLine row={myRow} mine />
        </ul>
      )}
      <ul className="flex flex-col gap-2">
        {visibleRows.map((row) => (
          <RankingLine key={row.memberId} row={row} mine={row.memberId === myMemberId} />
        ))}
      </ul>
      {visibleRows.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có ai trong bảng.</p>}
    </div>
  )
}
