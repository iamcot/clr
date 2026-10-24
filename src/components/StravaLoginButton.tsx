import Image from 'next/image'

type StravaLoginButtonProps = { next?: string; width?: number; fullWidth?: boolean }

const IMAGE_WIDTH_PX = 386
const IMAGE_HEIGHT_PX = 96
const BUTTON_ASPECT = IMAGE_HEIGHT_PX / IMAGE_WIDTH_PX

// Ảnh nút chính thức của Strava, chỉ đổi kích thước
export default function StravaLoginButton({ next, width = 193, fullWidth = false }: StravaLoginButtonProps) {
  const href = next ? `/api/auth/strava/start?next=${encodeURIComponent(next)}` : '/api/auth/strava/start'
  return (
    <a
      href={href}
      className={`flex shrink-0 items-center justify-center ${fullWidth ? 'w-full' : ''}`}
      aria-label="Đăng nhập bằng Strava"
    >
      <Image
        src="/strava/btn_strava.png"
        alt="Connect with Strava"
        width={fullWidth ? IMAGE_WIDTH_PX : width}
        height={fullWidth ? IMAGE_HEIGHT_PX : Math.round(width * BUTTON_ASPECT)}
        className={fullWidth ? 'h-auto w-full' : undefined}
        priority
      />
    </a>
  )
}
