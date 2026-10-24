import Link from 'next/link'
import StravaLoginButton from '@/components/StravaLoginButton'
import type { ViewerKind } from '@/lib/auth/viewerKind'

type GuestSummaryCardProps = { monthNumber: number; viewerKind: Exclude<ViewerKind, 'member'> }

// Thay cho thẻ thống kê tháng khi chưa có dữ liệu riêng để hiện
export default function GuestSummaryCard({ monthNumber, viewerKind }: GuestSummaryCardProps) {
  return (
    <div className="rounded-3xl bg-deep p-4 text-white">
      <p className="text-sm text-white/80">Tháng {monthNumber} của bạn</p>
      {viewerKind === 'guest' ? (
        <div className="mt-4 flex justify-center">
          <StravaLoginButton />
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/90">
          Tài khoản đang chờ BCN duyệt thành viên.{' '}
          <Link href="/pending" className="font-bold text-lime underline">
            Xem trạng thái
          </Link>
        </p>
      )}
    </div>
  )
}
