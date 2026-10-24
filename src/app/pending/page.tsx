import { redirect } from 'next/navigation'
import Avatar from '@/components/Avatar'
import { getCurrentMember, type CurrentMember } from '@/lib/auth/currentMember'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const STATUS_MESSAGES: Record<CurrentMember['status'], string> = {
  pending: 'Đang chờ BCN duyệt',
  active: '',
  inactive: 'Tài khoản đã ngưng',
  rejected: 'Yêu cầu tham gia chưa được BCN chấp nhận',
}

async function getZaloGroupUrl(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'zalo_group_url').maybeSingle()
  return typeof data?.value === 'string' && data.value ? data.value : null
}

export default async function PendingPage() {
  const member = await getCurrentMember()
  if (!member) redirect('/login')
  if (member.status === 'active') redirect('/')

  const zaloGroupUrl = await getZaloGroupUrl()

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
      <Avatar url={member.avatar_url} size={96} />
      <h1 className="text-xl font-black">{member.display_name ?? 'Thành viên mới'}</h1>
      <p className="text-lg font-bold text-brand-dark">{STATUS_MESSAGES[member.status]}</p>
      {member.rejection_reason && member.status === 'rejected' && (
        <p className="text-sm">Lý do: {member.rejection_reason}</p>
      )}
      <p className="text-sm text-muted">Khi BCN duyệt xong, bạn tải lại trang này để vào app.</p>
      {zaloGroupUrl && (
        <a href={zaloGroupUrl} className="min-h-11 font-bold text-brand-dark underline">
          Vào nhóm Zalo của CLB
        </a>
      )}
      <form action="/api/auth/logout" method="post">
        <button type="submit" className="min-h-11 px-4 text-sm text-muted underline">
          Đăng xuất
        </button>
      </form>
    </main>
  )
}
