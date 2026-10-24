'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import { useRealtimeRefresh } from '@/components/useRealtimeRefresh'
import { COMMENT_MAX_LENGTH } from '@/config/posts'
import { formatDateTimeVi } from '@/lib/format/dateTime'
import { addComment, deleteComment } from '@/lib/posts/memberActions'
import type { CommentView } from '@/lib/posts/loadPost'

type CommentSectionProps = {
  postId: string
  comments: CommentView[]
  myMemberId: string
  isBcn: boolean
}

function CommentForm({ postId, parentId, onDone }: { postId: string; parentId: string | null; onDone?: () => void }) {
  const [text, setText] = useState('')

  async function submit(formData: FormData) {
    const result = await addComment(formData)
    if (result) return result
    setText('')
    onDone?.()
  }

  return (
    <ActionForm action={submit} className="flex gap-2">
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <input
        name="body"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={COMMENT_MAX_LENGTH}
        placeholder={parentId ? 'Trả lời...' : 'Viết bình luận...'}
        required
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3"
      />
      <button
        type="submit"
        className="min-h-11 shrink-0 rounded-lg bg-brand px-4 font-bold text-white active:bg-brand-dark"
      >
        Gửi
      </button>
    </ActionForm>
  )
}

function CommentLine({
  comment,
  postId,
  canDelete,
  canReply,
}: {
  comment: CommentView
  postId: string
  canDelete: boolean
  canReply: boolean
}) {
  const [replying, setReplying] = useState(false)
  return (
    <div>
      <p className="text-sm">
        <span className="font-bold">{comment.authorName}</span>{' '}
        <span className="text-xs text-muted">{formatDateTimeVi(comment.createdAt)}</span>
      </p>
      <p className="whitespace-pre-line break-words">{comment.body}</p>
      <div className="flex gap-3">
        {canReply && (
          <button
            type="button"
            onClick={() => setReplying((value) => !value)}
            className="min-h-11 text-sm font-bold text-brand-dark"
          >
            Trả lời
          </button>
        )}
        {canDelete && (
          <ActionForm action={deleteComment}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="comment_id" value={comment.id} />
            <button type="submit" className="min-h-11 text-sm text-muted underline">
              Xoá
            </button>
          </ActionForm>
        )}
      </div>
      {replying && <CommentForm postId={postId} parentId={comment.id} onDone={() => setReplying(false)} />}
    </div>
  )
}

export default function CommentSection({ postId, comments, myMemberId, isBcn }: CommentSectionProps) {
  useRealtimeRefresh('post_comments', `post_id=eq.${postId}`)
  const roots = comments.filter((comment) => comment.parentId === null)
  const repliesOf = (rootId: string) => comments.filter((comment) => comment.parentId === rootId)
  const canDelete = (comment: CommentView) => isBcn || comment.memberId === myMemberId

  return (
    <div className="mt-6">
      <h2 className="text-lg font-black">Bình luận ({comments.length})</h2>
      <ul className="mt-2 flex flex-col gap-3">
        {roots.map((root) => (
          <li key={root.id} className="rounded-lg bg-white p-3">
            <CommentLine comment={root} postId={postId} canDelete={canDelete(root)} canReply />
            <ul className="mt-1 ml-4 flex flex-col gap-2 border-l-2 border-line pl-3">
              {repliesOf(root.id).map((reply) => (
                <li key={reply.id}>
                  <CommentLine comment={reply} postId={postId} canDelete={canDelete(reply)} canReply={false} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <CommentForm postId={postId} parentId={null} />
      </div>
    </div>
  )
}
