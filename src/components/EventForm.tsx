'use client'

import { useActionState, useEffect } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import { useToast } from '@/components/ToastProvider'
import { EVENT_KIND_LABELS, EVENT_KINDS, EVENT_STATUS_LABELS } from '@/config/events'
import { saveEvent, type EventFormState } from '@/lib/events/adminActions'
import type { EventStatus } from '@/lib/types/database'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const EMPTY_STATE: EventFormState = { errors: {}, values: {} }
const STATUSES = Object.keys(EVENT_STATUS_LABELS) as EventStatus[]

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="ml-1 text-xs text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

export default function EventForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveEvent, EMPTY_STATE)
  const toast = useToast()
  useBusyIndicator(pending)
  const value = (name: string) => state.values[name] ?? defaults[name] ?? ''

  useEffect(() => {
    if (state.errors.form) toast({ kind: 'error', text: state.errors.form })
  }, [state, toast])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={value('id')} />
      <Field label="Tên event" error={state.errors.title}>
        <input name="title" defaultValue={value('title')} maxLength={200} required className={INPUT_CLASS} />
      </Field>
      <Field label="Loại event" error={state.errors.kind}>
        <select name="kind" defaultValue={value('kind') || 'group_run'} className={INPUT_CLASS}>
          {EVENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {EVENT_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Trạng thái" hint="Nháp thì thành viên chưa thấy" error={state.errors.status}>
        <select name="status" defaultValue={value('status') || 'draft'} className={INPUT_CLASS}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {EVENT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Bắt đầu (giờ Việt Nam)" error={state.errors.starts_at}>
        <input name="starts_at" type="datetime-local" defaultValue={value('starts_at')} required className={INPUT_CLASS} />
      </Field>
      <Field label="Kết thúc (giờ Việt Nam)" error={state.errors.ends_at}>
        <input name="ends_at" type="datetime-local" defaultValue={value('ends_at')} required className={INPUT_CLASS} />
      </Field>
      <Field label="Hạn đăng ký" hint="Bỏ trống là tới giờ bắt đầu" error={state.errors.registration_closes_at}>
        <input
          name="registration_closes_at"
          type="datetime-local"
          defaultValue={value('registration_closes_at')}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Địa điểm">
        <input name="location_name" defaultValue={value('location_name')} className={INPUT_CLASS} />
      </Field>
      <div className="flex gap-2">
        <Field label="Vĩ độ" hint="để tự gắn hoạt động" error={state.errors.location_lat}>
          <input name="location_lat" inputMode="decimal" defaultValue={value('location_lat')} className={INPUT_CLASS} />
        </Field>
        <Field label="Kinh độ">
          <input name="location_lng" inputMode="decimal" defaultValue={value('location_lng')} className={INPUT_CLASS} />
        </Field>
      </div>
      <Field label="Số chỗ" hint="Bỏ trống là không giới hạn" error={state.errors.capacity}>
        <input name="capacity" inputMode="numeric" defaultValue={value('capacity')} className={INPUT_CLASS} />
      </Field>
      <Field label="Phí tham gia (đồng)" error={state.errors.fee}>
        <input name="fee" inputMode="numeric" defaultValue={value('fee')} className={INPUT_CLASS} />
      </Field>
      <Field label="Cự ly dự kiến (km)" error={state.errors.route_distance_km}>
        <input
          name="route_distance_km"
          inputMode="decimal"
          defaultValue={value('route_distance_km')}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Mô tả" hint="Markdown" error={state.errors.description_md}>
        <textarea
          name="description_md"
          defaultValue={value('description_md')}
          rows={8}
          className="w-full rounded-lg border border-line bg-white shadow-sm p-3"
        />
      </Field>
      <Field label="Ảnh bìa" hint="Link ảnh https" error={state.errors.cover_url}>
        <input name="cover_url" type="url" defaultValue={value('cover_url')} className={INPUT_CLASS} />
      </Field>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="absent_penalty" defaultChecked={value('absent_penalty') === 'on'} className="size-5" />
        Phạt người đăng ký “Đi” mà vắng
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark disabled:opacity-60"
      >
        Lưu event
      </button>
    </form>
  )
}
