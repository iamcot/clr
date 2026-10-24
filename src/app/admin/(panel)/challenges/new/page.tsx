import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ChallengeForm from '@/components/ChallengeForm'
import { NEW_CHALLENGE_DEFAULTS } from '@/lib/challenges/formDefaults'

export default function NewChallengePage() {
  return (
    <section>
      <AdminPageHeader title="Tạo challenge" backHref="/admin/challenges" backLabel="Challenge" />
      <ChallengeForm defaults={NEW_CHALLENGE_DEFAULTS} />
    </section>
  )
}
