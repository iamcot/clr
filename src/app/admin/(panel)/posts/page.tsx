import Link from 'next/link'
import { POST_KIND_LABELS, type PostKind } from '@/config/posts'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadAdminPosts, type AdminPostRow } from '@/lib/posts/loadAdminPosts'

function statusText(post: AdminPostRow, now: Date): string {
  if (!post.publishedAt) return 'Nháp'
  if (new Date(post.publishedAt).getTime() > now.getTime()) return `Hẹn giờ ${formatDateTimeVi(post.publishedAt)}`
  return `Đã đăng ${formatDateTimeVi(post.publishedAt)}`
}

export default async function AdminPostsPage() {
  const posts = await loadAdminPosts()
  const now = new Date()

  return (
    <section>
      <h1 className="text-2xl font-black">Bài viết</h1>
      <Link
        href="/admin/posts/new"
        className="mt-3 flex min-h-12 items-center justify-center rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
      >
        Soạn bài mới
      </Link>
      <ul className="mt-4 flex flex-col gap-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/admin/posts/${post.id}`} className="block rounded-lg bg-white p-3">
              <p className="font-bold">
                {post.pinned && '📌 '}
                {post.title}
              </p>
              <p className="text-sm text-muted">
                {POST_KIND_LABELS[post.kind as PostKind] ?? post.kind} · {statusText(post, now)}
                {post.requireAck && ' · cần xác nhận'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="mt-4 text-muted">Chưa có bài nào.</p>}
    </section>
  )
}
