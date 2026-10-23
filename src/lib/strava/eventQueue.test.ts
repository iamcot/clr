import { describe, expect, it, vi } from 'vitest'
import { RateLimitedError } from '@/lib/strava/errors'
import { retryDelaySeconds, runEventQueue, type QueuedEvent } from '@/lib/strava/eventQueue'

const NOW = new Date('2026-10-23T10:00:00Z')

function queued(id: number, attempts = 0): QueuedEvent {
  return { id, attempts, object_type: 'activity', object_id: id, aspect_type: 'create', owner_id: 1, updates: {} }
}

function makeDeps(events: QueuedEvent[]) {
  return {
    claimDueEvents: vi.fn().mockResolvedValue(events),
    markProcessed: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    releaseEvent: vi.fn().mockResolvedValue(undefined),
    process: vi.fn().mockResolvedValue('processed'),
    canSpend: vi.fn().mockResolvedValue(true),
    now: () => NOW,
  }
}

describe('retryDelaySeconds', () => {
  it('tăng gấp đôi sau mỗi lần lỗi', () => {
    expect([1, 2, 3].map(retryDelaySeconds)).toEqual([60, 120, 240])
  })
})

describe('runEventQueue', () => {
  it('đánh dấu đã xử lý khi thành công', async () => {
    const deps = makeDeps([queued(1), queued(2)])
    await expect(runEventQueue(deps)).resolves.toBe(2)
    expect(deps.markProcessed).toHaveBeenCalledTimes(2)
  })

  it('lỗi: tăng số lần thử và hẹn thử lại theo backoff', async () => {
    const deps = makeDeps([queued(1, 1)])
    deps.process.mockRejectedValue(new Error('hỏng'))

    await runEventQueue(deps)

    expect(deps.markFailed).toHaveBeenCalledWith(1, {
      attempts: 2,
      error: 'hỏng',
      retryAt: new Date('2026-10-23T10:02:00Z'),
    })
  })

  it('bị giới hạn tốc độ: trả event về hàng đợi, không tính lần thử', async () => {
    const deps = makeDeps([queued(1)])
    const retryAt = new Date('2026-10-23T10:15:00Z')
    deps.process.mockRejectedValue(new RateLimitedError(retryAt))

    await runEventQueue(deps)

    expect(deps.releaseEvent).toHaveBeenCalledWith(1, retryAt)
    expect(deps.markFailed).not.toHaveBeenCalled()
  })

  it('hết hạn mức: không gọi xử lý', async () => {
    const deps = makeDeps([queued(1)])
    deps.canSpend.mockResolvedValue(false)

    await expect(runEventQueue(deps)).resolves.toBe(0)
    expect(deps.process).not.toHaveBeenCalled()
    expect(deps.releaseEvent).toHaveBeenCalledWith(1, NOW)
  })
})
