import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { toProfileFormDefaults } from '@/lib/members/profileDefaults'

export default async function WelcomePage() {
  const member = await requireActiveMember()
  if (member.profile_onboarded_at) redirect('/')

  return (
    <main className="mx-auto min-h-dvh max-w-[480px] px-6 py-10">
      <h1 className="text-2xl font-black">Chào mừng đến với CLR</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Giới tính và năm sinh dùng để chia hạng mục challenge và bảng vàng. Bạn có thể bỏ qua và bổ sung sau trong phần
        Tôi.
      </p>
      <ProfileForm defaults={toProfileFormDefaults(member)} redirectTo="/" canSkip />
    </main>
  )
}
