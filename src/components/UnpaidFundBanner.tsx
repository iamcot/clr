import Link from 'next/link'
import { formatVnd } from '@/lib/format/money'

type UnpaidFundBannerProps = { amount: number; reason: string }

export default function UnpaidFundBanner({ amount, reason }: UnpaidFundBannerProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
      <div className="min-w-0">
        <p className="text-sm text-danger">Bạn còn nợ quỹ</p>
        <p className="text-2xl font-black text-danger">{formatVnd(amount)}</p>
        {reason && <p className="truncate text-xs text-danger">{reason}</p>}
      </div>
      <Link
        href="/fund"
        className="flex min-h-11 shrink-0 items-center rounded-full bg-danger px-5 font-bold text-white active:opacity-80"
      >
        Nộp ngay
      </Link>
    </div>
  )
}
