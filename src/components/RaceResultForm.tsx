'use client'

import { useActionState, useEffect, useState } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import { useToast } from '@/components/ToastProvider'
import { PR_DISTANCES } from '@/config/prDistances'
import { CUSTOM_DISTANCE_VALUE } from '@/lib/races/raceInput'
import { saveRaceResult } from '@/lib/races/raceActions'
import { EMPTY_RACE_FORM_STATE } from '@/lib/races/raceFormState'

type RaceResultFormProps = {
  defaults: Record<string, string>
  raceNameSuggestions: string[]
}

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

export default function RaceResultForm({ defaults, raceNameSuggestions }: RaceResultFormProps) {
  const [state, formAction, pending] = useActionState(saveRaceResult, EMPTY_RACE_FORM_STATE)
  const toast = useToast()
  useBusyIndicator(pending)
  const value = (field: string) => state.values[field] ?? defaults[field] ?? ''
  const [distance, setDistance] = useState(value('distance'))

  useEffect(() => {
    if (state.errors.form) toast({ kind: 'error', text: state.errors.form })
    else if (Object.keys(state.errors).length > 0) toast({ kind: 'error', text: 'Vui lòng kiểm tra lại các trường báo lỗi' })
  }, [state, toast])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={value('id')} />
      <input type="hidden" name="activity_id" value={value('activity_id')} />
      <Field label="Tên giải" error={state.errors.race_name}>
        <input name="race_name" list="race-names" defaultValue={value('race_name')} required className={INPUT_CLASS} />
        <datalist id="race-names">
          {raceNameSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Field>
      <Field label="Ngày chạy" error={state.errors.race_date}>
        <input name="race_date" type="date" defaultValue={value('race_date')} required className={INPUT_CLASS} />
      </Field>
      <Field label="Cự ly">
        <select name="distance" value={distance} onChange={(event) => setDistance(event.target.value)} className={INPUT_CLASS}>
          {PR_DISTANCES.map((option) => (
            <option key={option.name} value={option.name}>
              {option.label}
            </option>
          ))}
          <option value={CUSTOM_DISTANCE_VALUE}>Khác</option>
        </select>
      </Field>
      {distance === CUSTOM_DISTANCE_VALUE && (
        <>
          <Field label="Tên cự ly (ví dụ 15K)" error={state.errors.distance_label}>
            <input name="distance_label" defaultValue={value('distance_label')} className={INPUT_CLASS} />
          </Field>
          <Field label="Số km" error={state.errors.distance_km}>
            <input name="distance_km" defaultValue={value('distance_km')} inputMode="decimal" className={INPUT_CLASS} />
          </Field>
        </>
      )}
      <Field label="Thời gian chip (h:mm:ss)" error={state.errors.chip_time}>
        <input name="chip_time" defaultValue={value('chip_time')} placeholder="1:45:12" className={INPUT_CLASS} />
      </Field>
      <Field label="Thời gian súng (không bắt buộc)" error={state.errors.gun_time}>
        <input name="gun_time" defaultValue={value('gun_time')} className={INPUT_CLASS} />
      </Field>
      <Field label="Hạng chung (không bắt buộc)" error={state.errors.rank_overall}>
        <input name="rank_overall" defaultValue={value('rank_overall')} inputMode="numeric" className={INPUT_CLASS} />
      </Field>
      <Field label="Hạng nhóm tuổi (không bắt buộc)" error={state.errors.rank_age_group}>
        <input name="rank_age_group" defaultValue={value('rank_age_group')} inputMode="numeric" className={INPUT_CLASS} />
      </Field>
      <Field label="Số BIB (không bắt buộc)" error={state.errors.bib}>
        <input name="bib" defaultValue={value('bib')} className={INPUT_CLASS} />
      </Field>
      <Field label="Thành phố (không bắt buộc)" error={state.errors.city}>
        <input name="city" defaultValue={value('city')} className={INPUT_CLASS} />
      </Field>
      <Field label="Đơn vị tổ chức (không bắt buộc)" error={state.errors.organizer}>
        <input name="organizer" defaultValue={value('organizer')} className={INPUT_CLASS} />
      </Field>
      <Field label="Link giải (không bắt buộc)" error={state.errors.url}>
        <input name="url" defaultValue={value('url')} inputMode="url" className={INPUT_CLASS} />
      </Field>
      <Field label="Link ảnh giấy chứng nhận (không bắt buộc)" error={state.errors.certificate_url}>
        <input name="certificate_url" defaultValue={value('certificate_url')} inputMode="url" className={INPUT_CLASS} />
      </Field>
      {state.errors.form && <p role="alert" className="text-sm text-danger">{state.errors.form}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark disabled:opacity-60"
      >
        Lưu
      </button>
    </form>
  )
}
