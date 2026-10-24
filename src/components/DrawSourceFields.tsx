'use client'

import { useState } from 'react'
import { ADMIN_INPUT_CLASS } from '@/components/admin/styles'
import MultiSelectDropdown from '@/components/MultiSelectDropdown'
import { DRAW_SOURCE_LABELS, DRAW_SOURCE_TYPES, type DrawSourceType } from '@/config/draw'

type Option = { id: string; title: string }

const INPUT_CLASS = ADMIN_INPUT_CLASS

export default function DrawSourceFields({ challenges, events }: { challenges: Option[]; events: Option[] }) {
  const [sourceType, setSourceType] = useState<DrawSourceType>('challenge_completed')
  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="font-bold">Nguồn danh sách</span>
        <select
          name="source_type"
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value as DrawSourceType)}
          className={INPUT_CLASS}
        >
          {DRAW_SOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {DRAW_SOURCE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      {sourceType === 'challenge_completed' && (
        <div className="flex flex-col gap-1">
          <span className="font-bold">Challenge (chọn được nhiều)</span>
          <MultiSelectDropdown name="challenge_id" options={challenges} placeholder="Chọn challenge" />
        </div>
      )}
      {sourceType === 'event_checked_in' && (
        <div className="flex flex-col gap-1">
          <span className="font-bold">Event (chọn được nhiều)</span>
          <MultiSelectDropdown name="event_id" options={events} placeholder="Chọn event" />
        </div>
      )}
    </>
  )
}
