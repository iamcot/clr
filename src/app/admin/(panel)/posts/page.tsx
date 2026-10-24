import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import { adminButtonClass } from '@/components/admin/styles'
import { POST_KIND_LABELS, type PostKind } from '@/config/posts'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadAdminPosts, type AdminPostRow } from '@/lib/posts/loadAdminPosts'

function statusBadge(post: AdminPostRow, now: Date) {
  if (!post.publishedAt) return <Badge>Nháp</Badge>
  if (new Date(post.publishedAt).getTime() > now.getTime()) return <Badge tone="warning">Hẹn giờ</Badge>
  return <Badge tone="success">Đã đăng</Badge>
}

function postColumns(now: Date): DataTableColumn<AdminPostRow>[] {
  return [
    {
      key: 'title',
      header: 'Bài viết',
      isLink: true,
      cell: (post) => (
        <span>
          {post.pinned && '📌 '}
          {post.title}
          {post.requireAck && <span className="ml-2 text-xs font-normal text-muted">cần xác nhận</span>}
        </span>
      ),
    },
    { key: 'kind', header: 'Loại', hideBelowMd: true, cell: (post) => POST_KIND_LABELS[post.kind as PostKind] ?? post.kind },
    { key: 'status', header: 'Trạng thái', cell: (post) => statusBadge(post, now) },
    {
      key: 'published',
      header: 'Đăng lúc',
      hideBelowMd: true,
      cell: (post) => (post.publishedAt ? formatDateTimeVi(post.publishedAt) : '—'),
    },
  ]
}

export default async function AdminPostsPage() {
  const posts = await loadAdminPosts()

  return (
    <section>
      <AdminPageHeader
        title="Bài viết"
        description="Đăng thông báo và theo dõi người đã xác nhận"
        actions={
          <Link href="/admin/posts/new" className={adminButtonClass('primary')}>
            + Soạn bài mới
          </Link>
        }
      />
      <DataTable
        columns={postColumns(new Date())}
        rows={posts}
        rowKey={(post) => post.id}
        rowHref={(post) => `/admin/posts/${post.id}`}
        emptyText="Chưa có bài nào."
      />
    </section>
  )
}
