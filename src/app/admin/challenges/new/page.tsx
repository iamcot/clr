import Link from 'next/link'
import ChallengeForm from '@/components/ChallengeForm'
import { NEW_CHALLENGE_DEFAULTS } from '@/lib/challenges/formDefaults'

export default function NewChallengePage() {
  return (
    <section>
      <Link href="/admin/challenges" className="text-sm text-muted">
        ← Challenge
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-black">Tạo challenge</h1>
      <ChallengeForm defaults={NEW_CHALLENGE_DEFAULTS} />
    </section>
  )
}
