'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { DRAW_POLL_INTERVAL_MS, REEL_ANIMATION_MS, REEL_ITEM_HEIGHT_PX, REEL_NAME_COUNT, type DrawStatus } from '@/config/draw'
import type { DrawDetail } from '@/lib/draw/loadDraw'
import { estimateClockOffset, pickBetterOffset } from '@/lib/draw/clockOffset'
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

type Snapshot = { status: DrawStatus; results: DrawResultView[] }
type ClockEstimate = { offsetMs: number; roundTripMs: number }

// Hỏi trạng thái định kỳ khi đang quay; mỗi lần hỏi cũng cập nhật độ lệch đồng hồ với server
// nên mọi máy dừng hiệu ứng cùng lúc (không phụ thuộc Realtime)
function useLiveDraw(drawId: string, initial: DrawLiveProps) {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<Snapshot>({ status: initial.status, results: initial.results })
  const [now, setNow] = useState(initial.serverNowMs)
  const clock = useRef<ClockEstimate | null>(null)
  const knownStatus = useRef(initial.status)
  const polling = snapshot.status === 'live'

  useEffect(() => {
    // Trước lần hỏi đầu tiên, dùng mốc thời gian lúc server dựng trang
    clock.current ??= { offsetMs: initial.serverNowMs - Date.now(), roundTripMs: Infinity }
    const tick = () => setNow(Date.now() + (clock.current?.offsetMs ?? 0))
    tick()
    const timer = setInterval(tick, FRAME_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [initial.serverNowMs])

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const sentAt = Date.now()
      const response = await fetch(`/api/draws/${drawId}/state`, { cache: 'no-store' }).catch(() => null)
      if (cancelled || !response?.ok) return
      const state = (await response.json()) as { status: DrawStatus; results: DrawResultView[]; serverNowMs: number }
      const receivedAt = Date.now()
      clock.current = pickBetterOffset(clock.current, {
        offsetMs: estimateClockOffset(state.serverNowMs, sentAt, receivedAt),
        roundTripMs: receivedAt - sentAt,
      })
      setSnapshot({ status: state.status, results: state.results })
      if (state.status !== knownStatus.current) {
        knownStatus.current = state.status
        router.refresh()
      }
    }
    void poll()
    if (!polling) {
      return () => {
        cancelled = true
      }
    }
    const timer = setInterval(() => void poll(), DRAW_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [drawId, polling, router])

  return { snapshot, now }
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

export default function DrawLive(props: DrawLiveProps) {
  const { drawId, prizes, participantNames } = props
  const { snapshot, now } = useLiveDraw(drawId, props)
  const { status, results } = snapshot

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
