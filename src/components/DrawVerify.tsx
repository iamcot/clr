'use client'

import { useState } from 'react'
import { ONE_PRIZE_PER_MEMBER } from '@/config/draw'
import { pickWinners, type DrawParticipant, type DrawPrize } from '@/lib/draw/pick'
import { deriveSeedNumber, sha256Hex } from '@/lib/draw/seed'

type DrawVerifyProps = {
  seedCommit: string
  seedReveal: string
  participants: (DrawParticipant & { name: string })[]
  prizes: (DrawPrize & { name: string })[]
  results: { order: number; prizeId: string; memberId: string }[]
}

type VerifyOutcome = { commitMatches: boolean; resultsMatch: boolean }

async function verify({ seedCommit, seedReveal, participants, prizes, results }: DrawVerifyProps): Promise<VerifyOutcome> {
  const picks = pickWinners(participants, prizes, await deriveSeedNumber(seedReveal), ONE_PRIZE_PER_MEMBER)
  return {
    commitMatches: (await sha256Hex(seedReveal)) === seedCommit,
    resultsMatch:
      picks.length === results.length &&
      picks.every((pick, index) => {
        const result = results[index]
        return result?.order === pick.order && result.prizeId === pick.prizeId && result.memberId === pick.memberId
      }),
  }
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className={`rounded-lg p-3 font-bold ${ok ? 'bg-lime/30 text-deep' : 'bg-danger/10 text-danger'}`}>
      {ok ? '✓' : '✗'} {label}
    </p>
  )
}

export default function DrawVerify(props: DrawVerifyProps) {
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null)
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    setOutcome(await verify(props))
    setRunning(false)
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="rounded-lg bg-white p-3 text-sm shadow-sm">
        <p className="text-muted">Mã commit (công bố trước khi quay)</p>
        <p className="font-mono break-all">{props.seedCommit}</p>
        <p className="mt-2 text-muted">Mã bí mật (công bố sau khi quay)</p>
        <p className="font-mono break-all">{props.seedReveal}</p>
      </div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={running}
        className="min-h-12 rounded-full bg-brand font-bold text-white disabled:opacity-60"
      >
        {running ? 'Đang kiểm tra…' : 'Chạy lại phép quay trên máy bạn'}
      </button>
      {outcome && (
        <>
          <Check ok={outcome.commitMatches} label="sha256(mã bí mật) khớp mã commit đã công bố" />
          <Check ok={outcome.resultsMatch} label="Chạy lại thuật toán ra đúng người trúng từng giải" />
        </>
      )}
    </div>
  )
}
