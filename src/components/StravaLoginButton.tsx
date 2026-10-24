import Image from 'next/image'

type StravaLoginButtonProps = { next?: string; width?: number }

const BUTTON_ASPECT = 48 / 193

// Ảnh nút chính thức của Strava, chỉ đổi kích thước
export default function StravaLoginButton({ next, width = 193 }: StravaLoginButtonProps) {
  const href = next ? `/api/auth/strava/start?next=${encodeURIComponent(next)}` : '/api/auth/strava/start'
  return (
    <a href={href} className="flex shrink-0 items-center justify-center" aria-label="Đăng nhập bằng Strava">
      <Image
        src="/strava/btn_strava.png"
        alt="Connect with Strava"
        width={width}
        height={Math.round(width * BUTTON_ASPECT)}
        priority
      />
    </a>
  )
}
