import Image from 'next/image'
import { validAvatarUrl } from '@/lib/format/avatar'

type AvatarProps = { url: string | null | undefined; size: number; name?: string | null; className?: string }

// Cùng hình người với tab "Tôi"
function PersonIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size * 0.6}
      height={size * 0.6}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

export default function Avatar({ url, size, name, className = '' }: AvatarProps) {
  const src = validAvatarUrl(url)
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? ''}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        unoptimized
      />
    )
  }
  return (
    <span
      role={name ? 'img' : undefined}
      aria-label={name ?? undefined}
      className={`flex shrink-0 items-center justify-center rounded-full bg-line text-muted ${className}`}
      style={{ width: size, height: size }}
    >
      <PersonIcon size={size} />
    </span>
  )
}
