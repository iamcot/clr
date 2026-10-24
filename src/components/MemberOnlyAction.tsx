import Link from 'next/link'
import type { ViewerKind } from '@/lib/auth/viewerKind'
import { loginHref } from '@/lib/auth/nextPath'

type MemberOnlyActionProps = {
  kind: ViewerKind
  next: string
  guestLabel: string
  pendingText: string
  className: string
}

// Nút hoặc dòng thay cho thao tác chỉ thành viên đã duyệt làm được: khách sang trang đăng nhập, người chưa duyệt đọc lời nhắn
export default function MemberOnlyAction({ kind, next, guestLabel, pendingText, className }: MemberOnlyActionProps) {
  if (kind === 'member') return null
  if (kind === 'guest') {
    return (
      <Link href={loginHref(next)} className={className}>
        {guestLabel}
      </Link>
    )
  }
  return <p className="rounded-lg bg-white p-3 text-center text-sm text-muted shadow-sm">{pendingText}</p>
}
