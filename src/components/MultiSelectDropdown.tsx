'use client'

import { useState } from 'react'

type Option = { id: string; title: string }

type MultiSelectDropdownProps = { name: string; options: Option[]; placeholder: string }

export default function MultiSelectDropdown({ name, options, placeholder }: MultiSelectDropdownProps) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const summary = selected.length === 0 ? placeholder : `Đã chọn ${selected.length}`
  return (
    <details className="group rounded-lg border border-line bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3">
        <span className={selected.length === 0 ? 'text-muted' : 'font-bold'}>{summary}</span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="max-h-56 overflow-y-auto border-t border-line">
        {options.map((option) => (
          <label key={option.id} className="flex min-h-11 items-center gap-3 border-b border-line px-3 last:border-b-0">
            <input
              type="checkbox"
              name={name}
              value={option.id}
              checked={selected.includes(option.id)}
              onChange={() => toggle(option.id)}
              className="size-5 accent-brand"
            />
            <span>{option.title}</span>
          </label>
        ))}
        {options.length === 0 && <p className="p-3 text-sm text-muted">Chưa có dữ liệu.</p>}
      </div>
    </details>
  )
}
