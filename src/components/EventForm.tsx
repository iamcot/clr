'use client'

import { useActionState, useEffect } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import { useToast } from '@/components/ToastProvider'
import { EVENT_KIND_LABELS, EVENT_KINDS, EVENT_STATUS_LABELS } from '@/config/events'
import { saveEvent, type EventFormState } from '@/lib/events/adminActions'
import type { EventStatus } from '@/lib/types/database'
import AdminFormSection from '@/components/admin/AdminFormSection'
import FormField from '@/components/admin/FormField'
import StickyActionBar from '@/components/admin/StickyActionBar'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import ImageField from '@/components/ImageField'

const INPUT_CLASS = ADMIN_INPUT_CLASS
const EMPTY_STATE: EventFormState = { errors: {}, values: {} }
const STATUSES = Object.keys(EVENT_STATUS_LABELS) as EventStatus[]
const WIDE = 'md:col-span-2'

export default function EventForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveEvent, EMPTY_STATE)
  const toast = useToast()
  useBusyIndicator(pending)
  const value = (name: string) => state.values[name] ?? defaults[name] ?? ''

  useEffect(() => {
    if (state.errors.form) toast({ kind: 'error', text: state.errors.form })
  }, [state, toast])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={value('id')} />
      <AdminFormSection columns={2} title="Thông tin chung">
        <FormField label="Tên event" error={state.errors.title} className={WIDE}>
          <input name="title" defaultValue={value('title')} maxLength={200} required className={INPUT_CLASS} />
        </FormField>
        <FormField label="Loại event" error={state.errors.kind}>
          <select name="kind" defaultValue={value('kind') || 'group_run'} className={INPUT_CLASS}>
            {EVENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {EVENT_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Trạng thái" hint="Nháp thì thành viên chưa thấy" error={state.errors.status}>
          <select name="status" defaultValue={value('status') || 'draft'} className={INPUT_CLASS}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Ảnh bìa" error={state.errors.cover_url} className={WIDE}>
          <ImageField name="cover_url" purpose="cover" defaultValue={value('cover_url')} />
        </FormField>
      </AdminFormSection>

      <AdminFormSection columns={2} title="Thời gian">
        <FormField label="Bắt đầu (giờ Việt Nam)" error={state.errors.starts_at}>
          <input name="starts_at" type="datetime-local" defaultValue={value('starts_at')} required className={INPUT_CLASS} />
        </FormField>
        <FormField label="Kết thúc (giờ Việt Nam)" error={state.errors.ends_at}>
          <input name="ends_at" type="datetime-local" defaultValue={value('ends_at')} required className={INPUT_CLASS} />
        </FormField>
        <FormField label="Hạn đăng ký" hint="Bỏ trống là tới giờ bắt đầu" error={state.errors.registration_closes_at}>
          <input
            name="registration_closes_at"
            type="datetime-local"
            defaultValue={value('registration_closes_at')}
            className={INPUT_CLASS}
          />
        </FormField>
      </AdminFormSection>

      <AdminFormSection columns={2} title="Địa điểm">
        <FormField label="Địa điểm" className={WIDE}>
          <input name="location_name" defaultValue={value('location_name')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Vĩ độ" hint="để tự gắn hoạt động" error={state.errors.location_lat}>
          <input name="location_lat" inputMode="decimal" defaultValue={value('location_lat')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Kinh độ">
          <input name="location_lng" inputMode="decimal" defaultValue={value('location_lng')} className={INPUT_CLASS} />
        </FormField>
      </AdminFormSection>

      <AdminFormSection columns={2} title="Chi tiết">
        <FormField label="Số chỗ" hint="Bỏ trống là không giới hạn" error={state.errors.capacity}>
          <input name="capacity" inputMode="numeric" defaultValue={value('capacity')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Phí tham gia (đồng)" error={state.errors.fee}>
          <input name="fee" inputMode="numeric" defaultValue={value('fee')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Cự ly dự kiến (km)" error={state.errors.route_distance_km}>
          <input
            name="route_distance_km"
            inputMode="decimal"
            defaultValue={value('route_distance_km')}
            className={INPUT_CLASS}
          />
        </FormField>
        <label className="flex min-h-10 items-center gap-2 self-end">
          <input type="checkbox" name="absent_penalty" defaultChecked={value('absent_penalty') === 'on'} className="size-5" />
          Phạt người đăng ký “Đi” mà vắng
        </label>
        <FormField label="Mô tả" hint="Markdown" error={state.errors.description_md} className={WIDE}>
          <textarea
            name="description_md"
            defaultValue={value('description_md')}
            rows={8}
            className="w-full rounded-lg border border-hairline bg-white p-3 text-sm shadow-sm"
          />
        </FormField>
      </AdminFormSection>

      <StickyActionBar>
        <button type="submit" disabled={pending} className={`${adminButtonClass('primary')} disabled:opacity-60`}>
          {pending ? 'Đang lưu…' : 'Lưu event'}
        </button>
      </StickyActionBar>
    </form>
  )
}
