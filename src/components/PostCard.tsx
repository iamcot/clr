import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { POST_KIND_LABELS } from '@/config/posts'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { acknowledgePost } from '@/lib/posts/memberActions'
import type { FeedPostView } from '@/lib/posts/loadFeed'

export default function PostCard({ post }: { post: FeedPostView }) {
  return (
    <li className="overflow-hidden rounded-lg bg-white">
      <Link href={`/posts/${post.id}`} className="block active:bg-line">
        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa là link ngoài do BCN dán, chưa có kho ảnh để cấu hình next/image
          <img src={post.coverUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
        )}
        <div className="p-3">
          <p className="text-xs text-muted">
            {post.pinned && '📌 '}
            {POST_KIND_LABELS[post.kind]} · {formatDateTimeVi(post.publishedAt)}
          </p>
          <p className="mt-1 font-black">{post.title}</p>
          {post.excerpt && <p className="mt-1 text-sm text-muted">{post.excerpt}</p>}
          <p className="mt-2 text-xs text-muted">
            👍 {post.reactionCount} · 💬 {post.commentCount}
          </p>
        </div>
      </Link>
      {post.requireAck && (
        <div className="border-t border-line p-3">
          {post.acked ? (
            <p className="text-sm font-bold text-brand-dark">✓ Bạn đã đọc và đồng ý</p>
          ) : (
            <ActionForm action={acknowledgePost}>
              <input type="hidden" name="post_id" value={post.id} />
              <button
                type="submit"
                className="min-h-11 w-full rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
              >
                Đã đọc và đồng ý
              </button>
            </ActionForm>
          )}
        </div>
      )}
    </li>
  )
}
