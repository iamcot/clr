'use client'

import { useMemo, useState } from 'react'
import { useRealtimeRefresh } from '@/components/useRealtimeRefresh'

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

function RankingLine({ row, mine }: { row: LiveRankingRow; mine: boolean }) {
  return (
    <li className={`flex items-center gap-3 rounded-lg p-3 ${mine ? 'bg-lime/30' : 'bg-white shadow-sm'}`}>
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
  useRealtimeRefresh('challenge_entries', `challenge_id=eq.${challengeId}`)
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [onlyFollowing, setOnlyFollowing] = useState(false)

  const visibleRows = useMemo(() => {
    const following = new Set(followingIds)
    return rows
      .filter((row) => row.categoryId === categoryId)
      .filter((row) => !onlyFollowing || row.memberId === myMemberId || following.has(row.memberId))
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
  }, [rows, categoryId, onlyFollowing, followingIds, myMemberId])

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
      <ul className="flex flex-col gap-2">
        {visibleRows.map((row) => (
          <RankingLine key={row.memberId} row={row} mine={row.memberId === myMemberId} />
        ))}
      </ul>
      {visibleRows.length === 0 && <p className="mt-2 text-sm text-muted">Chưa có ai trong bảng.</p>}
    </div>
  )
}
