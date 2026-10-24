'use client'

import { useState } from 'react'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'

type PrizeRow = { key: number; name: string; quantity: string }

const INPUT_CLASS = ADMIN_INPUT_CLASS

function toPrizeLines(rows: PrizeRow[]): string {
  return rows
    .filter((row) => row.name.trim() !== '')
    .map((row) => `${row.name.trim()} | ${row.quantity.trim() || '1'}`)
    .join('\n')
}

export default function DrawPrizeFields() {
  const [rows, setRows] = useState<PrizeRow[]>([{ key: 0, name: '', quantity: '1' }])
  const [nextKey, setNextKey] = useState(1)

  function update(key: number, change: Partial<PrizeRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))
  }

  function addRow() {
    setRows((current) => [...current, { key: nextKey, name: '', quantity: '1' }])
    setNextKey(nextKey + 1)
  }

  function removeRow(key: number) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-bold">Các giải</legend>
      <p className="text-sm text-muted">Quay theo thứ tự từ trên xuống.</p>
      <input type="hidden" name="prizes" value={toPrizeLines(rows)} />
      <div className="grid grid-cols-[1fr_5rem_2.5rem] gap-2 text-sm text-muted">
        <span>Tên giải</span>
        <span>Số lượng</span>
      </div>
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-[1fr_5rem_2.5rem] gap-2">
          <input
            value={row.name}
            onChange={(event) => update(row.key, { name: event.target.value })}
            placeholder="Giải nhất: giày"
            aria-label="Tên giải"
            className={INPUT_CLASS}
          />
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={row.quantity}
            onChange={(event) => update(row.key, { quantity: event.target.value })}
            aria-label="Số lượng"
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            disabled={rows.length === 1}
            aria-label="Xoá giải"
            className="min-h-10 rounded-lg border border-hairline bg-white text-danger disabled:opacity-30 md:min-h-9"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className={adminButtonClass('secondary')}>
        + Thêm giải
      </button>
    </fieldset>
  )
}
