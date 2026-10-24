'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import DrawRaceStage from '@/components/DrawRaceStage'
import DrawReelStage from '@/components/DrawReelStage'
import DrawWaiting from '@/components/DrawWaiting'
import { DRAW_POLL_FAST_MS, DRAW_POLL_FAST_WINDOW_MS, DRAW_POLL_IDLE_MS } from '@/config/draw'
import { estimateClockOffset, pickBetterOffset } from '@/lib/draw/clockOffset'
import type { DrawDetail, DrawState } from '@/lib/draw/loadDraw'

type DrawLiveProps = {
  drawId: string
  initial: DrawState
  prizes: DrawDetail['prizes']
  participants: { memberId: string; name: string }[]
}

type ClockEstimate = { offsetMs: number; roundTripMs: number }
type WinnerSeen = { order: number; atMs: number }

const FRAME_INTERVAL_MS = 33

// Hỏi trạng thái theo chu kỳ thích ứng (thưa lúc rảnh, dồn dập khi sắp lộ người trúng) và bù chênh lệch đồng hồ với server
// ở mỗi lần hỏi, nên mọi máy chạy cùng một dòng thời gian và dừng cùng lúc
function useLiveDraw(drawId: string, initial: DrawState) {
  const router = useRouter()
  const [state, setState] = useState(initial)
  const [nowMs, setNowMs] = useState(initial.serverNowMs)
  const [winnerSeen, setWinnerSeen] = useState<WinnerSeen | null>(
    initial.spinning?.winner ? { order: initial.spinning.order, atMs: initial.serverNowMs } : null,
  )
  const clock = useRef<ClockEstimate | null>(null)
  const latest = useRef(initial)
  const polling = state.status === 'live' || state.status === 'draft'

  useEffect(() => {
    // Trước lần hỏi đầu tiên, dùng mốc thời gian lúc server dựng trang
    clock.current ??= { offsetMs: initial.serverNowMs - Date.now(), roundTripMs: Infinity }
    const tick = () => setNowMs(Date.now() + (clock.current?.offsetMs ?? 0))
    tick()
    const timer = setInterval(tick, FRAME_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [initial.serverNowMs])

  useEffect(() => {
    if (!polling) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function nextDelay(): number {
      const spinning = latest.current.spinning
      if (!spinning || spinning.winner) return DRAW_POLL_IDLE_MS
      const serverNow = Date.now() + (clock.current?.offsetMs ?? 0)
      return spinning.revealAtMs - serverNow <= DRAW_POLL_FAST_WINDOW_MS ? DRAW_POLL_FAST_MS : DRAW_POLL_IDLE_MS
    }

    async function poll() {
      const sentAt = Date.now()
      const response = await fetch(`/api/draws/${drawId}/state`, { cache: 'no-store' }).catch(() => null)
      if (!cancelled && response?.ok) {
        const next = (await response.json()) as DrawState
        const receivedAt = Date.now()
        clock.current = pickBetterOffset(clock.current, {
          offsetMs: estimateClockOffset(next.serverNowMs, sentAt, receivedAt),
          roundTripMs: receivedAt - sentAt,
        })
        const previous = latest.current
        latest.current = next
        setState(next)
        if (next.spinning?.winner && !(previous.spinning?.order === next.spinning.order && previous.spinning.winner)) {
          setWinnerSeen({ order: next.spinning.order, atMs: receivedAt + (clock.current?.offsetMs ?? 0) })
        }
        const finishedSpin = next.completed.length !== previous.completed.length
        if (next.status !== previous.status || finishedSpin) router.refresh()
      }
      if (!cancelled) timer = setTimeout(() => void poll(), nextDelay())
    }

    timer = setTimeout(() => void poll(), nextDelay())
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [drawId, polling, router])

  return { state, nowMs, winnerSeen }
}

function Stage({ state, nowMs, winnerSeen, participants }: { state: DrawState; nowMs: number; winnerSeen: WinnerSeen | null; participants: DrawLiveProps['participants'] }) {
  const { spinning } = state
  if (state.status === 'draft') return <DrawWaiting text="Chờ BCN mở quay số" />
  if (!spinning) {
    if (state.status !== 'live') return null
    return <DrawWaiting text={state.completed.length === 0 ? 'Chờ BCN quay giải đầu tiên' : 'Chờ BCN quay giải tiếp theo'} />
  }
  const winnerSeenAtMs = winnerSeen?.order === spinning.order ? winnerSeen.atMs : null
  return (
    <div className="mt-4">
      <p className="mb-2 text-center text-sm text-muted">Đang quay: {spinning.prizeName}</p>
      {state.style === 'reel' ? (
        <DrawReelStage
          spinning={spinning}
          names={participants.map((participant) => participant.name)}
          nowMs={nowMs}
          winnerSeenAtMs={winnerSeenAtMs}
        />
      ) : (
        <DrawRaceStage
          kind={state.style === 'duck' ? 'duck' : 'runner'}
          spinning={spinning}
          racers={participants}
          nowMs={nowMs}
          winnerSeenAtMs={winnerSeenAtMs}
        />
      )}
    </div>
  )
}

export default function DrawLive({ drawId, initial, prizes, participants }: DrawLiveProps) {
  const { state, nowMs, winnerSeen } = useLiveDraw(drawId, initial)
  const winnersByPrize = new Map<string, string[]>()
  for (const result of state.completed) {
    winnersByPrize.set(result.prizeId, [...(winnersByPrize.get(result.prizeId) ?? []), result.memberName])
  }

  return (
    <div>
      <Stage state={state} nowMs={nowMs} winnerSeen={winnerSeen} participants={participants} />
      <ul className="mt-4 flex flex-col gap-2">
        {prizes.map((prize) => {
          const winners = winnersByPrize.get(prize.id) ?? []
          return (
            <li key={prize.id} className="rounded-lg bg-white p-3 shadow-sm">
              <p className="font-bold">
                {prize.name} <span className="text-sm font-normal text-muted">({winners.length}/{prize.quantity})</span>
              </p>
              {winners.length > 0 && <p className="mt-1 text-brand-dark">{winners.join(', ')}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
