'use client'

import { useState } from 'react'
import ActionForm from '@/components/ActionForm'
import Avatar from '@/components/Avatar'
import { SendIcon } from '@/components/PostIcons'
import { useRealtimeRefresh } from '@/components/useRealtimeRefresh'
import { COMMENT_MAX_LENGTH } from '@/config/posts'
import { formatDateVi } from '@/lib/format/dateTime'
import { formatRelativeVi } from '@/lib/format/relativeTime'
import { addComment, deleteComment } from '@/lib/posts/memberActions'
import type { CommentView } from '@/lib/posts/loadPost'

type CommentSectionProps = {
  postId: string
  comments: CommentView[]
  myMemberId: string
  myName: string
  isBcn: boolean
}

type ReplyTarget = { id: string; name: string }

function CommentTime({ iso }: { iso: string }) {
  return (
    <span className="text-xs text-muted" suppressHydrationWarning>
      {formatRelativeVi(iso, new Date()) ?? formatDateVi(iso)}
    </span>
  )
}

function CommentLine({
  comment,
  postId,
  canDelete,
  onReply,
}: {
  comment: CommentView
  postId: string
  canDelete: boolean
  onReply: (() => void) | null
}) {
  return (
    <div className="flex gap-2.5">
      <Avatar url={comment.avatarUrl} size={32} name={comment.authorName} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-bold">{comment.authorName}</span> <span className="text-muted">·</span>{' '}
          <CommentTime iso={comment.createdAt} />
        </p>
        <p className="whitespace-pre-line break-words">{comment.body}</p>
        <div className="flex gap-4">
          {onReply && (
            <button type="button" onClick={onReply} className="min-h-9 text-xs font-bold text-muted">
              Trả lời
            </button>
          )}
          {canDelete && (
            <ActionForm action={deleteComment}>
              <input type="hidden" name="post_id" value={postId} />
              <input type="hidden" name="comment_id" value={comment.id} />
              <button type="submit" className="min-h-9 text-xs text-muted">
                Xoá
              </button>
            </ActionForm>
          )}
        </div>
      </div>
    </div>
  )
}

function Composer({
  postId,
  myName,
  replyTo,
  onDone,
}: {
  postId: string
  myName: string
  replyTo: ReplyTarget | null
  onDone: () => void
}) {
  const [text, setText] = useState('')

  async function submit(formData: FormData) {
    const result = await addComment(formData)
    if (result) return result
    setText('')
    onDone()
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 border-t border-line bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-[480px] px-3 pt-2 pb-2">
        {replyTo && (
          <p className="mb-1 flex items-center justify-between px-3 text-xs text-muted">
            <span>
              Đang trả lời <b>{replyTo.name}</b>
            </span>
            <button type="button" onClick={onDone} aria-label="Huỷ trả lời" className="min-h-8 px-2">
              ✕
            </button>
          </p>
        )}
        <ActionForm action={submit} className="flex items-center gap-2 rounded-full bg-surface pr-1 pl-4">
          <input type="hidden" name="post_id" value={postId} />
          {replyTo && <input type="hidden" name="parent_id" value={replyTo.id} />}
          <input
            name="body"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder={replyTo ? `Trả lời ${replyTo.name}` : `Bình luận dưới tên ${myName}`}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 bg-transparent outline-none"
          />
          {text.trim() !== '' && (
            <button type="submit" aria-label="Gửi bình luận" className="flex size-10 shrink-0 items-center justify-center text-brand">
              <SendIcon />
            </button>
          )}
        </ActionForm>
      </div>
    </div>
  )
}

export default function CommentSection({ postId, comments, myMemberId, myName, isBcn }: CommentSectionProps) {
  useRealtimeRefresh('post_comments', `post_id=eq.${postId}`)
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null)
  const roots = comments.filter((comment) => comment.parentId === null)
  const repliesOf = (rootId: string) => comments.filter((comment) => comment.parentId === rootId)
  const canDelete = (comment: CommentView) => isBcn || comment.memberId === myMemberId

  return (
    <div className="mt-2 pb-20">
      <ul className="flex flex-col gap-3">
        {roots.map((root) => (
          <li key={root.id}>
            <CommentLine
              comment={root}
              postId={postId}
              canDelete={canDelete(root)}
              onReply={() => setReplyTo({ id: root.id, name: root.authorName })}
            />
            <ul className="mt-2 ml-10 flex flex-col gap-3">
              {repliesOf(root.id).map((reply) => (
                <li key={reply.id}>
                  <CommentLine comment={reply} postId={postId} canDelete={canDelete(reply)} onReply={null} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <Composer postId={postId} myName={myName} replyTo={replyTo} onDone={() => setReplyTo(null)} />
    </div>
  )
}
