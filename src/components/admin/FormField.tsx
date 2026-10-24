type FormFieldProps = {
  label: string
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}

export default function FormField({ label, hint, error, className = '', children }: FormFieldProps) {
  return (
    <label className={`block text-left ${className}`}>
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="ml-1 text-xs text-muted">{hint}</span>}
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}
