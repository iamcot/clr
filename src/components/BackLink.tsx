import Link from 'next/link'

export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-0.5 text-sm font-bold text-brand-dark">
      <svg
        viewBox="0 0 24 24"
        className="-ml-1 size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 5-7 7 7 7" />
      </svg>
      {children}
    </Link>
  )
}
