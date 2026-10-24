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
    <section className={`rounded-xl border border-hairline bg-white p-4 shadow-sm md:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-black">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
