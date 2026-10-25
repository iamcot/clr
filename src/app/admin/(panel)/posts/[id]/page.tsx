import Link from 'next/link'
import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import Pagination from '@/components/admin/Pagination'
import StatCard from '@/components/admin/StatCard'
import { adminButtonClass } from '@/components/admin/styles'
import PostForm from '@/components/PostForm'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import { deletePost, publishDraftNow } from '@/lib/posts/adminActions'
import { toVietnamInputValue } from '@/lib/format/dateTime'
import { loadAckStats, loadAdminPost } from '@/lib/posts/loadAdminPosts'

const TABS = ['edit', 'acks'] as const

type NotAcked = NonNullable<Awaited<ReturnType<typeof loadAckStats>>>['notAcked'][number]

const NOT_ACKED_COLUMNS: DataTableColumn<NotAcked>[] = [
  { key: 'name', header: 'Thành viên', cell: (member) => <b>{member.displayName}</b> },
  { key: 'code', header: 'Mã', hideBelowMd: true, cell: (member) => member.memberCode },
  {
    key: 'read',
    header: 'Trạng thái',
    cell: (member) => (member.read ? <Badge tone="warning">Đã mở, chưa bấm</Badge> : <Badge>Chưa mở</Badge>),
  },
]

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const post = await loadAdminPost(id)
  if (!post) notFound()
  const stats = post.require_ack ? await loadAckStats(id) : null
  const scheduled = post.published_at && new Date(post.published_at).getTime() > new Date().getTime()
  const publishMode = !post.published_at ? 'draft' : scheduled ? 'schedule' : 'now'
  const tab = pickTab(TABS, query.tab, 'edit')
  const basePath = `/admin/posts/${id}`
  const paged = slicePage(stats?.notAcked ?? [], parsePage(query.page))

  return (
    <section>
      <AdminPageHeader
        title="Sửa bài"
        backHref="/admin/posts"
        backLabel="Bài viết"
        description={post.title}
        actions={
          <>
            {post.published_at && !scheduled && (
              <Link href={`/posts/${id}`} className={adminButtonClass('secondary')}>
                Xem như thành viên
              </Link>
            )}
            {!post.published_at && (
              <ActionForm action={publishDraftNow}>
                <input type="hidden" name="post_id" value={id} />
                <button type="submit" className={adminButtonClass('primary')}>
                  Đăng ngay
                </button>
              </ActionForm>
            )}
          </>
        }
      />
      {stats && (
        <AdminTabs
          items={[
            { href: basePath, label: 'Soạn bài', active: tab === 'edit' },
            { href: `${basePath}?tab=acks`, label: `Xác nhận đã đọc (${stats.ackedCount}/${stats.activeMembers})`, active: tab === 'acks' },
          ]}
        />
      )}

      <div className="mt-4">
        {(tab === 'edit' || !stats) && (
          <div className="flex flex-col gap-4">
            <PostForm
              defaults={{
                id,
                title: post.title,
                kind: post.kind,
                body_md: post.body_md,
                cover_url: post.cover_url ?? '',
                require_ack: post.require_ack ? 'on' : '',
                pinned: post.pinned ? 'on' : '',
                pinned_until: post.pinned_until ? toVietnamInputValue(post.pinned_until) : '',
                publish_mode: publishMode,
                scheduled_at: scheduled && post.published_at ? toVietnamInputValue(post.published_at) : '',
              }}
            />
            <AdminCard title="Vùng nguy hiểm">
              <ActionForm action={deletePost} className="flex flex-wrap items-center justify-between gap-3">
                <input type="hidden" name="post_id" value={id} />
                <p className="text-sm text-muted">Xoá bài sẽ ẩn bài khỏi bảng tin của thành viên.</p>
                <button type="submit" className={adminButtonClass('danger')}>
                  Xoá bài
                </button>
              </ActionForm>
            </AdminCard>
          </div>
        )}

        {tab === 'acks' && stats && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Đã xác nhận" value={`${stats.ackedCount}/${stats.activeMembers}`} />
              <StatCard label="Đã mở đọc" value={stats.readCount} />
              <StatCard label="Chưa xác nhận" value={stats.notAcked.length} tone={stats.notAcked.length > 0 ? 'alert' : 'default'} />
            </div>
            <div className="flex">
              <Link href={`${basePath}/csv`} prefetch={false} className={adminButtonClass('secondary')}>
                Xuất CSV người chưa xác nhận
              </Link>
            </div>
            <div>
              <DataTable
                columns={NOT_ACKED_COLUMNS}
                rows={paged.rows}
                rowKey={(member) => member.memberId}
                emptyText="Mọi người đã xác nhận."
              />
              <Pagination
                window={paged.window}
                hrefFor={(page) => hrefWithPage(basePath, query, page)}
                unit="người chưa xác nhận"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
