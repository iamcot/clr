export default function AdminCard({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-md border border-line bg-white p-3 md:p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-black">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
