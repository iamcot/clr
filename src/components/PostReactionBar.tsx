'use client'

import { useOptimistic } from 'react'
import ActionForm from '@/components/ActionForm'
import { CommentIcon, HeartIcon } from '@/components/PostIcons'
import { toggleReaction, type ReactionState } from '@/lib/posts/reaction'
import { reactToPost } from '@/lib/posts/memberActions'

type PostReactionBarProps = { postId: string; mine: boolean; count: number; commentCount: number }

export default function PostReactionBar({ postId, mine, count, commentCount }: PostReactionBarProps) {
  const [state, applyToggle] = useOptimistic<ReactionState, void>({ mine, count }, (current) => toggleReaction(current))

  async function submit(formData: FormData) {
    applyToggle()
    return reactToPost(formData)
  }

  return (
    <div className="mt-4 flex items-center gap-5 border-t border-line pt-3 text-muted">
      <ActionForm action={submit}>
        <input type="hidden" name="post_id" value={postId} />
        <button
          type="submit"
          aria-pressed={state.mine}
          aria-label={state.mine ? 'Bỏ tim' : 'Thả tim'}
          className={`flex min-h-11 items-center gap-1.5 ${state.mine ? 'text-danger' : ''}`}
        >
          <HeartIcon filled={state.mine} />
          <span className="font-bold">{state.count}</span>
        </button>
      </ActionForm>
      <span className="flex min-h-11 items-center gap-1.5">
        <CommentIcon />
        <span className="font-bold">{commentCount}</span>
      </span>
    </div>
  )
}
