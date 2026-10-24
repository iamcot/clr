import Link from 'next/link'

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  href?: string
  tone?: 'default' | 'alert'
}

export default function StatCard({ label, value, hint, href, tone = 'default' }: StatCardProps) {
  const valueClass = tone === 'alert' ? 'text-danger' : 'text-ink'
  const content = (
    <>
      <span className="block text-sm text-muted">{label}</span>
      <span className={`mt-1 block text-xl font-black break-words sm:text-3xl ${valueClass}`}>{value}</span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </>
  )
  const className = 'block rounded-xl border border-line bg-white p-4 shadow-sm'
  if (!href) return <div className={className}>{content}</div>
  return (
    <Link href={href} className={`${className} active:bg-surface md:hover:border-brand`}>
      {content}
    </Link>
  )
}
