import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import { loginHref } from '@/lib/auth/nextPath'
import type { ViewerKind } from '@/lib/auth/viewerKind'
import { setFollow } from '@/lib/members/followActions'

type FollowButtonProps = { memberId: string; following: boolean; viewerKind: ViewerKind; next: string }

const BASE_CLASS = 'flex min-h-11 items-center justify-center rounded-lg border px-4 font-bold'
const SOFT_CLASS = `${BASE_CLASS} border-brand/30 bg-brand/10 text-brand-dark active:bg-brand/20`
const FOLLOWING_CLASS = `${BASE_CLASS} border-line bg-white text-ink`

export default function FollowButton({ memberId, following, viewerKind, next }: FollowButtonProps) {
  if (viewerKind === 'pending') return null
  if (viewerKind === 'guest') {
    return (
      <Link href={loginHref(next)} className={SOFT_CLASS}>
        Theo dõi
      </Link>
    )
  }
  return (
    <ActionForm action={setFollow}>
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="follow" value={following ? 'false' : 'true'} />
      <button type="submit" className={following ? FOLLOWING_CLASS : SOFT_CLASS}>
        {following ? 'Bỏ theo dõi' : 'Theo dõi'}
      </button>
    </ActionForm>
  )
}
