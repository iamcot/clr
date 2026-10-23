import { describe, expect, it } from 'vitest'
import { parseWebhookEvent } from '@/lib/strava/webhookEvent'

describe('parseWebhookEvent', () => {
  it('đọc event hoạt động của Strava', () => {
    expect(
      parseWebhookEvent({
        object_type: 'activity',
        object_id: 1360128428,
        aspect_type: 'update',
        owner_id: 134815,
        subscription_id: 120475,
        event_time: 1516126040,
        updates: { title: 'Messi' },
      }),
    ).toEqual({
      object_type: 'activity',
      object_id: 1360128428,
      aspect_type: 'update',
      owner_id: 134815,
      event_time: '2018-01-16T18:07:20.000Z',
      updates: { title: 'Messi' },
    })
  })

  it('từ chối nội dung thiếu trường', () => {
    expect(parseWebhookEvent({ object_type: 'activity' })).toBeNull()
    expect(parseWebhookEvent(null)).toBeNull()
    expect(parseWebhookEvent('x')).toBeNull()
  })
})
