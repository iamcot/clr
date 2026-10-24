import Link from 'next/link'

export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-1 text-sm font-bold text-brand-dark">
      <span aria-hidden>←</span>
      {children}
    </Link>
  )
}
