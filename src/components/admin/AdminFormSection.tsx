import AdminCard from '@/components/admin/AdminCard'

type AdminFormSectionProps = {
  title: string
  description?: string
  columns?: 1 | 2
  children: React.ReactNode
}

export default function AdminFormSection({ title, description, columns = 1, children }: AdminFormSectionProps) {
  const grid = columns === 2 ? 'md:grid-cols-2' : ''
  return (
    <AdminCard title={title}>
      {description && <p className="-mt-1 mb-3 text-sm text-muted">{description}</p>}
      <div className={`grid gap-3 ${grid}`}>{children}</div>
    </AdminCard>
  )
}
