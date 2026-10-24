'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import DrawCelebration from '@/components/DrawCelebration'
import DrawRaceStage from '@/components/DrawRaceStage'
import DrawReelStage from '@/components/DrawReelStage'
import DrawWaiting from '@/components/DrawWaiting'
import { DRAW_POLL_FAST_MS, DRAW_POLL_FAST_WINDOW_MS, DRAW_POLL_IDLE_MS } from '@/config/draw'
import { estimateClockOffset, pickBetterOffset } from '@/lib/draw/clockOffset'
import type { DrawDetail, DrawState, SpinningView } from '@/lib/draw/loadDraw'

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

type Celebration = { prizeName: string; winnerName: string }

function currentCelebration(state: DrawState, nowMs: number): Celebration | null {
  const { spinning } = state
  if (spinning?.winner && nowMs >= spinning.revealAtMs) {
    return { prizeName: spinning.prizeName, winnerName: spinning.winner.name }
  }
  if (spinning) return null
  const last = state.completed[state.completed.length - 1]
  return last ? { prizeName: last.prizeName, winnerName: last.memberName } : null
}

function SpinningStage({ state, spinning, nowMs, winnerSeen, participants }: StageProps & { spinning: SpinningView }) {
  const winnerSeenAtMs = winnerSeen?.order === spinning.order ? winnerSeen.atMs : null
  const banner = `Đang quay giải ${spinning.prizeName}`
  if (state.style === 'reel') {
    return (
      <div className="mt-4 rounded-2xl bg-deep">
        <p className="px-3 pt-3 text-center text-sm font-bold text-lime">{banner}</p>
        <DrawReelStage
          spinning={spinning}
          names={participants.map((participant) => participant.name)}
          nowMs={nowMs}
          winnerSeenAtMs={winnerSeenAtMs}
        />
      </div>
    )
  }
  return (
    <div className="relative mt-4">
      <p className="absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-deep/80 px-3 py-1 text-sm font-bold whitespace-nowrap text-white">
        {banner}
      </p>
      <DrawRaceStage
        kind={state.style === 'duck' ? 'duck' : 'runner'}
        spinning={spinning}
        racers={participants}
        nowMs={nowMs}
        winnerSeenAtMs={winnerSeenAtMs}
      />
    </div>
  )
}

type StageProps = {
  state: DrawState
  nowMs: number
  winnerSeen: WinnerSeen | null
  participants: DrawLiveProps['participants']
}

function Stage(props: StageProps) {
  const { state, nowMs } = props
  if (state.status === 'draft') return <DrawWaiting text="Chờ BCN mở quay số" />
  const celebration = currentCelebration(state, nowMs)
  if (celebration) {
    return (
      <DrawCelebration
        key={`${celebration.prizeName}:${celebration.winnerName}`}
        prizeName={celebration.prizeName}
        winnerName={celebration.winnerName}
        waitingNext={state.status === 'live'}
      />
    )
  }
  if (state.spinning) return <SpinningStage {...props} spinning={state.spinning} />
  if (state.status !== 'live') return null
  return <DrawWaiting text="Chờ BCN quay giải đầu tiên" />
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
