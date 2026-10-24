import BackLink from '@/components/BackLink'

type AdminPageHeaderProps = {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}

export default function AdminPageHeader({ title, description, backHref, backLabel, actions }: AdminPageHeaderProps) {
  return (
    <header className="mb-4">
      {backHref && <BackLink href={backHref}>{backLabel ?? 'Quay lại'}</BackLink>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}
