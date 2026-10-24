import BackLink from '@/components/BackLink'
import ChallengeForm from '@/components/ChallengeForm'
import { NEW_CHALLENGE_DEFAULTS } from '@/lib/challenges/formDefaults'

export default function NewChallengePage() {
  return (
    <section>
      <BackLink href="/admin/challenges">Challenge</BackLink>
      <h1 className="mt-2 mb-4 text-2xl font-black">Tạo challenge</h1>
      <ChallengeForm defaults={NEW_CHALLENGE_DEFAULTS} />
    </section>
  )
}
