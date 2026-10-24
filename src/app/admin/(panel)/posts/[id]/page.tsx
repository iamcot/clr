import Link from 'next/link'
import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import ActionForm from '@/components/ActionForm'
import PostForm from '@/components/PostForm'
import { deletePost, publishDraftNow } from '@/lib/posts/adminActions'
import { toVietnamInputValue } from '@/lib/format/dateTime'
import { loadAckStats, loadAdminPost } from '@/lib/posts/loadAdminPosts'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await loadAdminPost(id)
  if (!post) notFound()
  const stats = post.require_ack ? await loadAckStats(id) : null
  const scheduled = post.published_at && new Date(post.published_at).getTime() > new Date().getTime()
  const publishMode = !post.published_at ? 'draft' : scheduled ? 'schedule' : 'now'

  return (
    <section>
      <BackLink href="/admin/posts">Bài viết</BackLink>
      <h1 className="mt-2 mb-4 text-2xl font-black">Sửa bài</h1>
      {post.published_at && !scheduled && (
        <Link href={`/posts/${id}`} className="mb-3 flex min-h-11 items-center font-bold text-brand-dark underline">
          Xem bài như thành viên
        </Link>
      )}
      {!post.published_at && (
        <ActionForm action={publishDraftNow} className="mb-3">
          <input type="hidden" name="post_id" value={id} />
          <button
            type="submit"
            className="min-h-12 w-full rounded-md bg-brand font-bold text-white active:bg-brand-dark"
          >
            Đăng ngay
          </button>
        </ActionForm>
      )}
      {stats && (
        <div className="mb-4 rounded-md bg-white p-3">
          <p className="font-bold">Xác nhận đã đọc</p>
          <p className="text-sm text-muted">
            Đã xác nhận {stats.ackedCount}/{stats.activeMembers} · đã mở đọc {stats.readCount} · chưa xác nhận{' '}
            {stats.notAcked.length}
          </p>
          <Link
            href={`/admin/posts/${id}/csv`}
            prefetch={false}
            className="flex min-h-11 items-center font-bold text-brand-dark underline"
          >
            Xuất CSV người chưa xác nhận
          </Link>
          <ul className="mt-1 max-h-64 overflow-y-auto text-sm">
            {stats.notAcked.map((member) => (
              <li key={member.memberId} className="py-1">
                {member.displayName} <span className="text-muted">{member.memberCode}</span>
                {member.read && <span className="text-muted"> · đã mở nhưng chưa bấm</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
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
      <ActionForm action={deletePost} className="mt-6">
        <input type="hidden" name="post_id" value={id} />
        <button type="submit" className="min-h-11 w-full rounded-md border border-danger font-bold text-danger">
          Xoá bài
        </button>
      </ActionForm>
    </section>
  )
}
