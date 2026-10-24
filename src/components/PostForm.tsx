'use client'

import { useActionState, useEffect, useState } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import Markdown from '@/components/Markdown'
import { useToast } from '@/components/ToastProvider'
import { POST_KIND_LABELS, POST_KINDS } from '@/config/posts'
import { savePost, type PostFormState } from '@/lib/posts/adminActions'
import ImageField from '@/components/ImageField'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const EMPTY_STATE: PostFormState = { errors: {}, values: {} }

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
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={value('id')} />
      <Field label="Tiêu đề" error={state.errors.title}>
        <input name="title" defaultValue={value('title')} maxLength={200} required className={INPUT_CLASS} />
      </Field>
      <Field label="Loại bài" error={state.errors.kind}>
        <select name="kind" defaultValue={value('kind') || 'announcement'} className={INPUT_CLASS}>
          {POST_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {POST_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Nội dung"
        hint="Markdown: # tiêu đề, **đậm**, *nghiêng*, - danh sách, [chữ](https://link)"
        error={state.errors.body_md}
      >
        <textarea
          name="body_md"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          className="w-full rounded-lg border border-line bg-white shadow-sm p-3"
        />
      </Field>
      <button
        type="button"
        onClick={() => setPreviewing((current) => !current)}
        className="min-h-11 rounded-lg border border-line bg-white font-bold"
      >
        {previewing ? 'Ẩn xem trước' : 'Xem trước'}
      </button>
      {previewing && (
        <div className="rounded-lg bg-white shadow-sm p-3">
          <Markdown source={body} />
        </div>
      )}
      <Field label="Ảnh bìa" error={state.errors.cover_url}>
        <ImageField name="cover_url" purpose="cover" defaultValue={value('cover_url')} />
      </Field>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="require_ack" defaultChecked={value('require_ack') === 'on'} className="size-5" />
        Cần thành viên bấm “Đã đọc và đồng ý”
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="pinned" defaultChecked={value('pinned') === 'on'} className="size-5" />
        Ghim lên đầu trang chủ
      </label>
      {state.errors.pinned && <span className="text-sm text-danger">{state.errors.pinned}</span>}
      <Field label="Ghim đến" hint="Bỏ trống là ghim mãi" error={state.errors.pinned_until}>
        <input name="pinned_until" type="datetime-local" defaultValue={value('pinned_until')} className={INPUT_CLASS} />
      </Field>
      <Field label="Đăng bài" error={state.errors.scheduled_at}>
        <select name="publish_mode" defaultValue={publishMode} className={INPUT_CLASS}>
          <option value="now">Đăng ngay</option>
          <option value="schedule">Hẹn giờ</option>
          <option value="draft">Lưu nháp</option>
        </select>
      </Field>
      <Field label="Giờ đăng (nếu hẹn giờ, giờ Việt Nam)">
        <input name="scheduled_at" type="datetime-local" defaultValue={value('scheduled_at')} className={INPUT_CLASS} />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark disabled:opacity-60"
      >
        Lưu bài
      </button>
    </form>
  )
}
