import { describe, expect, it } from 'vitest'
import { parsePostInput, resolvePublishedAt, type PostInput } from '@/lib/posts/postInput'

function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

const VALID = { title: 'Họp CLB', body_md: 'Nội dung', kind: 'announcement', publish_mode: 'now' }

describe('parsePostInput', () => {
  it('nhận bài hợp lệ', () => {
    const result = parsePostInput(form(VALID))
    expect(result).toMatchObject({ ok: true, value: { title: 'Họp CLB', publishMode: 'now', pinned: false } })
  })

  it('bắt buộc tiêu đề và loại bài', () => {
    const result = parsePostInput(form({ ...VALID, title: ' ', kind: 'x' }))
    expect(result).toMatchObject({ ok: false, errors: { title: expect.any(String), kind: expect.any(String) } })
  })

  it('chỉ nhận ảnh bìa https', () => {
    expect(parsePostInput(form({ ...VALID, cover_url: 'http://a.vn/x.jpg' }))).toMatchObject({ ok: false })
    expect(parsePostInput(form({ ...VALID, cover_url: 'javascript:alert(1)' }))).toMatchObject({ ok: false })
    expect(parsePostInput(form({ ...VALID, cover_url: 'https://a.vn/x.jpg' }))).toMatchObject({ ok: true })
  })

  it('hẹn giờ đọc giờ Việt Nam thành UTC', () => {
    const result = parsePostInput(form({ ...VALID, publish_mode: 'schedule', scheduled_at: '2026-11-01T20:00' }))
    expect(result).toMatchObject({ ok: true, value: { scheduledAt: '2026-11-01T13:00:00.000Z' } })
  })

  it('hẹn giờ mà thiếu giờ thì báo lỗi', () => {
    expect(parsePostInput(form({ ...VALID, publish_mode: 'schedule' }))).toMatchObject({
      ok: false,
      errors: { scheduled_at: expect.any(String) },
    })
  })

  it('bỏ hạn ghim khi không ghim', () => {
    const result = parsePostInput(form({ ...VALID, pinned_until: '2026-11-01T20:00' }))
    expect(result).toMatchObject({ ok: true, value: { pinned: false, pinnedUntil: null } })
  })
})

describe('resolvePublishedAt', () => {
  const now = new Date('2026-11-01T00:00:00Z')
  const base: PostInput = {
    title: 't',
    bodyMd: '',
    kind: 'announcement',
    coverUrl: null,
    pinned: false,
    pinnedUntil: null,
    requireAck: false,
    publishMode: 'now',
    scheduledAt: null,
  }

  it('nháp thì không có giờ đăng', () => {
    expect(resolvePublishedAt({ ...base, publishMode: 'draft' }, now, null)).toBeNull()
  })

  it('đăng ngay giữ giờ đăng cũ nếu bài đã đăng', () => {
    expect(resolvePublishedAt(base, now, '2026-10-30T00:00:00Z')).toBe('2026-10-30T00:00:00Z')
    expect(resolvePublishedAt(base, now, null)).toBe(now.toISOString())
  })

  it('hẹn giờ lấy giờ đã chọn', () => {
    expect(
      resolvePublishedAt({ ...base, publishMode: 'schedule', scheduledAt: '2026-11-02T00:00:00.000Z' }, now, null),
    ).toBe('2026-11-02T00:00:00.000Z')
  })
})
