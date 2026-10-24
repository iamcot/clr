import ActionForm from '@/components/ActionForm'
import { setFollow } from '@/lib/members/followActions'

export default function FollowButton({ memberId, following }: { memberId: string; following: boolean }) {
  return (
    <ActionForm action={setFollow}>
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="follow" value={following ? 'false' : 'true'} />
      <button
        type="submit"
        className={`min-h-11 rounded-lg px-4 font-bold ${
          following ? 'border border-line bg-white text-ink' : 'bg-brand text-white'
        }`}
      >
        {following ? 'Bỏ theo dõi' : 'Theo dõi'}
      </button>
    </ActionForm>
  )
}
