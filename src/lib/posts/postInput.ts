import { POST_KINDS, type PostKind } from '@/config/posts'
import { fromVietnamInputValue } from '@/lib/format/dateTime'

export type PublishMode = 'now' | 'schedule' | 'draft'

export type PostInput = {
  title: string
  bodyMd: string
  kind: PostKind
  coverUrl: string | null
  pinned: boolean
  pinnedUntil: string | null
  requireAck: boolean
  publishMode: PublishMode
  scheduledAt: string | null
}

export type PostInputResult = { ok: true; value: PostInput } | { ok: false; errors: Record<string, string> }

const PUBLISH_MODES: PublishMode[] = ['now', 'schedule', 'draft']
const TITLE_MAX_LENGTH = 200
const BODY_MAX_LENGTH = 20000

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function parseDateField(formData: FormData, key: string, errors: Record<string, string>, label: string): string | null {
  const raw = text(formData, key)
  if (raw === '') return null
  const iso = fromVietnamInputValue(raw)
  if (!iso) errors[key] = `${label} không hợp lệ`
  return iso
}

export function parsePostInput(formData: FormData): PostInputResult {
  const errors: Record<string, string> = {}
  const title = text(formData, 'title')
  const bodyMd = String(formData.get('body_md') ?? '').trim()
  const kind = POST_KINDS.find((item) => item === text(formData, 'kind'))
  const publishMode = PUBLISH_MODES.find((item) => item === text(formData, 'publish_mode')) ?? 'draft'
  const coverUrl = text(formData, 'cover_url')

  if (title === '') errors.title = 'Nhập tiêu đề'
  if (title.length > TITLE_MAX_LENGTH) errors.title = `Tiêu đề tối đa ${TITLE_MAX_LENGTH} ký tự`
  if (bodyMd.length > BODY_MAX_LENGTH) errors.body_md = `Nội dung tối đa ${BODY_MAX_LENGTH} ký tự`
  if (!kind) errors.kind = 'Chọn loại bài'
  if (coverUrl !== '' && !isHttpsUrl(coverUrl)) errors.cover_url = 'Link ảnh bìa phải bắt đầu bằng https://'

  const scheduledAt = parseDateField(formData, 'scheduled_at', errors, 'Giờ đăng')
  if (publishMode === 'schedule' && !scheduledAt && !errors.scheduled_at) errors.scheduled_at = 'Chọn giờ đăng'
  const pinned = formData.get('pinned') === 'on'
  const pinnedUntil = parseDateField(formData, 'pinned_until', errors, 'Hạn ghim')

  if (Object.keys(errors).length > 0 || !kind) return { ok: false, errors }
  return {
    ok: true,
    value: {
      title,
      bodyMd,
      kind,
      coverUrl: coverUrl === '' ? null : coverUrl,
      pinned,
      pinnedUntil: pinned ? pinnedUntil : null,
      requireAck: formData.get('require_ack') === 'on',
      publishMode,
      scheduledAt: publishMode === 'schedule' ? scheduledAt : null,
    },
  }
}

// Bản nháp: null; đăng ngay: giờ hiện tại; hẹn giờ: giờ đã chọn
export function resolvePublishedAt(input: PostInput, now: Date, existingPublishedAt: string | null): string | null {
  if (input.publishMode === 'draft') return null
  if (input.publishMode === 'schedule') return input.scheduledAt
  return existingPublishedAt && new Date(existingPublishedAt).getTime() <= now.getTime()
    ? existingPublishedAt
    : now.toISOString()
}
