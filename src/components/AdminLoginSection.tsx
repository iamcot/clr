import ActionForm from '@/components/ActionForm'
import AdminCard from '@/components/admin/AdminCard'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import { ADMIN_PASSWORD_MIN_LENGTH } from '@/lib/auth/adminCredentials'
import { removeAdminLogin, setAdminLogin } from '@/lib/members/adminLoginActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function loadUsername(memberId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('admin_logins').select('username').eq('member_id', memberId).maybeSingle()
  return data?.username ?? null
}

export default async function AdminLoginSection({ memberId, isSelf }: { memberId: string; isSelf: boolean }) {
  const username = await loadUsername(memberId)

  return (
    <AdminCard title="Tài khoản đăng nhập admin" className="mt-4">
      <p className="mb-3 text-sm text-muted">
        {username
          ? `Đăng nhập tại /admin bằng tên “${username}”, không cần Strava.`
          : 'Chưa có tài khoản. Tạo tên đăng nhập và mật khẩu để người này vào /admin mà không cần Strava.'}
      </p>
      <ActionForm action={setAdminLogin} className="flex flex-col gap-3">
        <input type="hidden" name="member_id" value={memberId} />
        <label className="block">
          <span className="text-sm font-bold">Tên đăng nhập</span>
          <input
            name="username"
            defaultValue={username ?? ''}
            required
            autoCapitalize="none"
            autoComplete="off"
            className={`${ADMIN_INPUT_CLASS} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">{username ? 'Mật khẩu mới' : 'Mật khẩu'}</span>
          <input
            name="password"
            type="password"
            required
            minLength={ADMIN_PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            className={`${ADMIN_INPUT_CLASS} mt-1`}
          />
        </label>
        <button type="submit" className={adminButtonClass('primary')}>
          {username ? 'Đổi mật khẩu hoặc tên' : 'Tạo tài khoản'}
        </button>
      </ActionForm>
      {username && !isSelf && (
        <ActionForm action={removeAdminLogin} className="mt-3">
          <input type="hidden" name="member_id" value={memberId} />
          <button type="submit" className={adminButtonClass('danger')}>
            Gỡ tài khoản đăng nhập
          </button>
        </ActionForm>
      )}
    </AdminCard>
  )
}
