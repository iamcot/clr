'use client'

import { useActionState, useEffect, useState } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import Markdown from '@/components/Markdown'
import { useToast } from '@/components/ToastProvider'
import { POST_KIND_LABELS, POST_KINDS } from '@/config/posts'
import { savePost, type PostFormState } from '@/lib/posts/adminActions'
import DateInput from '@/components/admin/DateInput'
import AdminFormSection from '@/components/admin/AdminFormSection'
import FormField from '@/components/admin/FormField'
import StickyActionBar from '@/components/admin/StickyActionBar'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import ImageField from '@/components/ImageField'

const INPUT_CLASS = ADMIN_INPUT_CLASS
const EMPTY_STATE: PostFormState = { errors: {}, values: {} }
const WIDE = 'md:col-span-2'

export default function PostForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(savePost, EMPTY_STATE)
  const toast = useToast()
  useBusyIndicator(pending)
  const value = (name: string) => state.values[name] ?? defaults[name] ?? ''
  const [body, setBody] = useState(value('body_md'))
  const [previewing, setPreviewing] = useState(false)
  const publishMode = value('publish_mode') || 'now'

  useEffect(() => {
    if (state.errors.form) toast({ kind: 'error', text: state.errors.form })
  }, [state, toast])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={value('id')} />
      <AdminFormSection columns={2} title="Nội dung">
        <FormField label="Tiêu đề" error={state.errors.title} className={WIDE}>
          <input name="title" defaultValue={value('title')} maxLength={200} required className={INPUT_CLASS} />
        </FormField>
        <FormField label="Loại bài" error={state.errors.kind}>
          <select name="kind" defaultValue={value('kind') || 'announcement'} className={INPUT_CLASS}>
            {POST_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {POST_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Ảnh bìa" error={state.errors.cover_url}>
          <ImageField name="cover_url" purpose="cover" defaultValue={value('cover_url')} />
        </FormField>
        <FormField
          label="Nội dung"
          hint="Markdown: # tiêu đề, **đậm**, *nghiêng*, - danh sách, [chữ](https://link)"
          error={state.errors.body_md}
          className={WIDE}
        >
          <textarea
            name="body_md"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            className="w-full rounded-lg border border-hairline bg-white p-3 text-sm shadow-sm"
          />
        </FormField>
        <div className={WIDE}>
          <button type="button" onClick={() => setPreviewing((current) => !current)} className={adminButtonClass('secondary')}>
            {previewing ? 'Ẩn xem trước' : 'Xem trước'}
          </button>
          {previewing && (
            <div className="mt-3 rounded-lg border border-hairline bg-white p-3">
              <Markdown source={body} />
            </div>
          )}
        </div>
      </AdminFormSection>

      <AdminFormSection columns={2} title="Hiển thị">
        <label className="flex min-h-10 items-center gap-2">
          <input type="checkbox" name="require_ack" defaultChecked={value('require_ack') === 'on'} className="size-5" />
          Cần thành viên bấm “Đã đọc và đồng ý”
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input type="checkbox" name="pinned" defaultChecked={value('pinned') === 'on'} className="size-5" />
          Ghim lên đầu trang chủ
        </label>
        {state.errors.pinned && <span className={`text-sm text-danger ${WIDE}`}>{state.errors.pinned}</span>}
        <FormField label="Ghim đến" hint="Bỏ trống là ghim mãi" error={state.errors.pinned_until}>
          <DateInput name="pinned_until" type="datetime-local" defaultValue={value('pinned_until')} />
        </FormField>
      </AdminFormSection>

      <AdminFormSection columns={2} title="Đăng bài">
        <FormField label="Cách đăng" error={state.errors.scheduled_at}>
          <select name="publish_mode" defaultValue={publishMode} className={INPUT_CLASS}>
            <option value="now">Đăng ngay</option>
            <option value="schedule">Hẹn giờ</option>
            <option value="draft">Lưu nháp</option>
          </select>
        </FormField>
        <FormField label="Giờ đăng (nếu hẹn giờ, giờ Việt Nam)">
          <DateInput name="scheduled_at" type="datetime-local" defaultValue={value('scheduled_at')} />
        </FormField>
      </AdminFormSection>

      <StickyActionBar>
        <button type="submit" disabled={pending} className={`${adminButtonClass('primary')} disabled:opacity-60`}>
          {pending ? 'Đang lưu…' : 'Lưu bài'}
        </button>
      </StickyActionBar>
    </form>
  )
}
