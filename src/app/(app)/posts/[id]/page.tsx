import { notFound } from 'next/navigation'
import BackLink from '@/components/BackLink'
import ActionForm from '@/components/ActionForm'
import CommentSection from '@/components/CommentSection'
import Markdown from '@/components/Markdown'
import MemberOnlyAction from '@/components/MemberOnlyAction'
import MarkPostRead from '@/components/MarkPostRead'
import ReactionBar from '@/components/ReactionBar'
import { POST_KIND_LABELS } from '@/config/posts'
import { activeMemberOf, getViewer } from '@/lib/auth/viewer'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { loadComments, loadPostDetail } from '@/lib/posts/loadPost'
import { acknowledgePost } from '@/lib/posts/memberActions'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getViewer()
  const member = activeMemberOf(viewer)
  const post = await loadPostDetail(id, member?.id ?? null, new Date())
  if (!post) notFound()
  const comments = member ? await loadComments(id) : []

  return (
    <article>
      {member && <MarkPostRead postId={id} />}
      <BackLink href="/">Trang chủ</BackLink>
      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa là link ngoài do BCN dán, chưa có kho ảnh để cấu hình next/image
        <img src={post.coverUrl} alt="" className="mt-2 h-48 w-full rounded-lg object-cover" />
      )}
      <p className="mt-3 text-xs text-muted">
        {POST_KIND_LABELS[post.kind]} · {formatDateTimeVi(post.publishedAt)}
        {post.authorName && ` · ${post.authorName}`}
      </p>
      <h1 className="mt-1 text-2xl font-black">{post.title}</h1>
      <Markdown source={post.bodyMd} />

      {post.requireAck && member && (
        <div className="mt-4">
          {post.acked ? (
            <p className="font-bold text-brand-dark">✓ Bạn đã đọc và đồng ý</p>
          ) : (
            <ActionForm action={acknowledgePost}>
              <input type="hidden" name="post_id" value={id} />
              <button
                type="submit"
                className="min-h-12 w-full rounded-lg bg-brand font-bold text-white active:bg-brand-dark"
              >
                Đã đọc và đồng ý
              </button>
            </ActionForm>
          )}
        </div>
      )}

      {member ? (
        <>
          <ReactionBar postId={id} mine={post.myReaction} counts={post.reactionCounts} />
          <CommentSection postId={id} comments={comments} myMemberId={member.id} isBcn={member.role === 'bcn'} />
        </>
      ) : (
        <div className="mt-6">
          <MemberOnlyAction
            kind={viewer.kind}
            next={`/posts/${id}`}
            guestLabel="Đăng nhập để thả tim và bình luận"
            pendingText="Chờ duyệt thành viên để bình luận"
            className="flex min-h-12 items-center justify-center rounded-full border border-brand font-bold text-brand-dark"
          />
        </div>
      )}
    </article>
  )
}
