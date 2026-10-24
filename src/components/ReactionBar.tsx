import ActionForm from '@/components/ActionForm'
import { REACTIONS, type ReactionCode } from '@/config/posts'
import { reactToPost } from '@/lib/posts/memberActions'

type ReactionBarProps = {
  postId: string
  mine: ReactionCode | null
  counts: Partial<Record<ReactionCode, number>>
}

export default function ReactionBar({ postId, mine, counts }: ReactionBarProps) {
  return (
    <div className="mt-4 flex gap-2">
      {REACTIONS.map((reaction) => (
        <ActionForm key={reaction.code} action={reactToPost} className="flex-1">
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="emoji" value={reaction.code} />
          <button
            type="submit"
            aria-label={reaction.label}
            aria-pressed={mine === reaction.code}
            className={`min-h-11 w-full rounded-lg border text-sm font-bold ${
              mine === reaction.code ? 'border-brand bg-lime/30' : 'border-line bg-white'
            }`}
          >
            {reaction.symbol} {counts[reaction.code] ?? 0}
          </button>
        </ActionForm>
      ))}
    </div>
  )
}
