import Image from 'next/image'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import StravaLoginButton from '@/components/StravaLoginButton'
import type { Viewer } from '@/lib/auth/viewer'

const HEADER_LOGIN_BUTTON_WIDTH_PX = 120
const HEADER_AVATAR_PX = 36

function HeaderAccount({ viewer }: { viewer: Viewer }) {
  if (!viewer.member) return <StravaLoginButton width={HEADER_LOGIN_BUTTON_WIDTH_PX} />
  const href = viewer.kind === 'member' ? '/me' : '/pending'
  return (
    <Link href={href} aria-label="Tài khoản của tôi" className="flex min-h-11 items-center">
      <Avatar url={viewer.member.avatar_url} size={HEADER_AVATAR_PX} />
    </Link>
  )
}

export default function AppHeader({ viewer }: { viewer: Viewer }) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-white px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-deep">
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={40} height={40} className="rounded-full" />
      <div className="leading-tight">
        <p className="text-lg font-black tracking-wide">CLR</p>
        <p className="text-xs text-muted">Celadon Running Club</p>
      </div>
      <div className="ml-auto">
        <HeaderAccount viewer={viewer} />
      </div>
    </header>
  )
}
