import Link from 'next/link'
import StravaLoginButton from '@/components/StravaLoginButton'
import type { ViewerKind } from '@/lib/auth/viewerKind'

// Thay cho thẻ thống kê tháng khi chưa có dữ liệu riêng: khách chỉ có nút đăng nhập, người chưa duyệt có thẻ báo chờ duyệt
export default function GuestSummaryCard({ viewerKind }: { viewerKind: Exclude<ViewerKind, 'member'> }) {
  if (viewerKind === 'guest') return <StravaLoginButton fullWidth />
  return (
    <div className="rounded-3xl bg-deep p-4 text-white">
      <p className="text-sm text-white/90">
        Tài khoản đang chờ BCN duyệt thành viên.{' '}
        <Link href="/pending" className="font-bold text-lime underline">
          Xem trạng thái
        </Link>
      </p>
    </div>
  )
}
