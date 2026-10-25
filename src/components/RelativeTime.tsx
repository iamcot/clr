import { formatDateVi } from '@/lib/format/dateTime'
import { formatRelativeVi } from '@/lib/format/relativeTime'

// Giờ tương đối ('15 giờ trước'); quá một tuần thì hiện ngày. Giờ khác nhau giữa máy chủ và trình duyệt nên bỏ cảnh báo hydrate
export default function RelativeTime({ iso, className = 'text-xs text-muted' }: { iso: string; className?: string }) {
  return (
    <span className={className} suppressHydrationWarning>
      {formatRelativeVi(iso, new Date()) ?? formatDateVi(iso)}
    </span>
  )
}
