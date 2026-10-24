import ProfileForm from '@/components/ProfileForm'
import StravaSettings from '@/components/StravaSettings'
import { MEMBER_TYPE_LABELS } from '@/config/members'
import { formatDateVi } from '@/lib/format/dateTime'
import { requireActiveMember, type CurrentMember } from '@/lib/auth/currentMember'
import { toProfileFormDefaults } from '@/lib/members/profileDefaults'

function MembershipInfo({ member }: { member: CurrentMember }) {
  return (
    <dl className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-white p-3 text-sm">
      <dt className="text-muted">Mã thành viên</dt>
      <dd className="font-bold">{member.member_code}</dd>
      <dt className="text-muted">Loại</dt>
      <dd>{member.member_type ? MEMBER_TYPE_LABELS[member.member_type] : 'Chưa phân loại'}</dd>
      <dt className="text-muted">Ngày vào CLB</dt>
      <dd>{member.joined_at ? formatDateVi(member.joined_at) : '—'}</dd>
    </dl>
  )
}

export default async function MeSettingsPage() {
  const member = await requireActiveMember()

  return (
    <section>
      <h1 className="mb-4 text-2xl font-black">Cài đặt</h1>
      <MembershipInfo member={member} />
      <ProfileForm defaults={toProfileFormDefaults(member)} redirectTo="/me" />
      <StravaSettings shared={member.share_stats_with_club} privateInTotals={member.share_private_in_totals} />
    </section>
  )
}
