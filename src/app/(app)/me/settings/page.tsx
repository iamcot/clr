import ProfileForm from '@/components/ProfileForm'
import StravaSettings from '@/components/StravaSettings'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { toProfileFormDefaults } from '@/lib/members/profileDefaults'

export default async function MeSettingsPage() {
  const member = await requireActiveMember()

  return (
    <section>
      <h1 className="mb-4 text-2xl font-black">Cài đặt</h1>
      <ProfileForm defaults={toProfileFormDefaults(member)} redirectTo="/me" />
      <StravaSettings shared={member.share_stats_with_club} />
    </section>
  )
}
