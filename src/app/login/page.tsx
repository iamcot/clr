import Image from 'next/image'
import { redirect } from 'next/navigation'
import ClearOfflineCache from '@/components/ClearOfflineCache'
import StravaLoginButton from '@/components/StravaLoginButton'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { safeNextPath } from '@/lib/auth/nextPath'
import { LOGIN_ERROR_MESSAGES } from '@/config/loginErrors'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const member = await getCurrentMember()
  if (member) redirect('/')

  const { error, next } = await searchParams
  const errorMessage = error ? LOGIN_ERROR_MESSAGES[error] : undefined

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-6 px-6 text-center">
      <ClearOfflineCache />
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={96} height={96} className="rounded-full" priority />
      <h1 className="text-2xl font-black">CLB chạy bộ CLR</h1>
      {errorMessage && (
        <p role="alert" className="rounded-lg border border-danger px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}
      <StravaLoginButton next={safeNextPath(next) ?? undefined} />
      <p className="text-sm text-muted">
        CLR đọc hồ sơ và hoạt động chạy của bạn trên Strava (kể cả hoạt động riêng tư) để thống kê và tính challenge.
        Bạn có thể ngắt kết nối bất cứ lúc nào.
      </p>
    </main>
  )
}
