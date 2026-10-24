'use client'

import { useEffect, useState } from 'react'
import { useRealtimeRefresh } from '@/components/useRealtimeRefresh'
import { REEL_ANIMATION_MS, REEL_ITEM_HEIGHT_PX, REEL_NAME_COUNT, type DrawStatus } from '@/config/draw'
import type { DrawDetail } from '@/lib/draw/loadDraw'
import { buildReelNames, easeOutCubic, reelProgress } from '@/lib/draw/reel'

type DrawResultView = DrawDetail['results'][number]

type DrawLiveProps = {
  drawId: string
  status: DrawStatus
  prizes: DrawDetail['prizes']
  participantNames: string[]
  results: DrawResultView[]
  serverNowMs: number
}

const FRAME_INTERVAL_MS = 50

// Đồng hồ đã bù chênh lệch với server để mọi máy dừng hiệu ứng cùng lúc
function useServerClock(serverNowMs: number): number {
  const [offsetMs] = useState(() => serverNowMs - Date.now())
  const [now, setNow] = useState(serverNowMs)
  useEffect(() => {
    const tick = () => setNow(Date.now() + offsetMs)
    tick()
    const timer = setInterval(tick, FRAME_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [offsetMs])
  return now
}

function Reel({ result, names, now }: { result: DrawResultView; names: string[]; now: number }) {
  const reel = buildReelNames(names, result.memberName, result.order, REEL_NAME_COUNT)
  const finalOffset = (reel.length - 1) * REEL_ITEM_HEIGHT_PX
  const offset = easeOutCubic(reelProgress(now, result.revealAt, REEL_ANIMATION_MS)) * finalOffset
  return (
    <div
      className="relative mx-auto mt-3 overflow-hidden rounded-2xl bg-deep text-white"
      style={{ height: REEL_ITEM_HEIGHT_PX * 3 }}
      aria-live="polite"
    >
      <div style={{ transform: `translateY(${-offset}px)` }}>
        {[' ', ...reel, ' '].map((name, index) => (
          <p
            key={index}
            className="flex items-center justify-center truncate px-3 text-xl font-bold"
            style={{ height: REEL_ITEM_HEIGHT_PX }}
          >
            {name}
          </p>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 border-y-2 border-lime"
        style={{ top: REEL_ITEM_HEIGHT_PX, height: REEL_ITEM_HEIGHT_PX }}
      />
    </div>
  )
}

export default function DrawLive({ drawId, status, prizes, participantNames, results, serverNowMs }: DrawLiveProps) {
  useRealtimeRefresh('draw_results', `draw_id=eq.${drawId}`)
  useRealtimeRefresh('draws', `id=eq.${drawId}`)
  const now = useServerClock(serverNowMs)

  const revealed = results.filter((result) => result.revealAt <= now)
  const spinning = results.find((result) => result.revealAt > now)
  const winnersByPrize = new Map<string, DrawResultView[]>()
  for (const result of revealed) winnersByPrize.set(result.prizeId, [...(winnersByPrize.get(result.prizeId) ?? []), result])

  return (
    <div>
      {spinning && (
        <div className="mt-4">
          <p className="text-center text-sm text-muted">Đang quay: {spinning.prizeName}</p>
          <Reel result={spinning} names={participantNames} now={now} />
        </div>
      )}
      {!spinning && status === 'live' && <p className="mt-4 text-center text-muted">Chờ BCN quay giải tiếp theo…</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {prizes.map((prize) => {
          const winners = winnersByPrize.get(prize.id) ?? []
          return (
            <li key={prize.id} className="rounded-lg bg-white p-3 shadow-sm">
              <p className="font-bold">
                {prize.name} <span className="text-sm font-normal text-muted">({winners.length}/{prize.quantity})</span>
              </p>
              {winners.length > 0 && (
                <p className="mt-1 text-brand-dark">{winners.map((winner) => winner.memberName).join(', ')}</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
