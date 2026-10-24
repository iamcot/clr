'use client'

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg bg-brand px-5 font-bold text-white print:hidden">
      {label}
    </button>
  )
}
