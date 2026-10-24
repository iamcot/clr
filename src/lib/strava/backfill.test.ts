import { describe, expect, it, vi } from 'vitest'
import { backfillStartDate, runBackfill } from '@/lib/strava/backfill'
import { RateLimitedError, StravaNotConnectedError } from '@/lib/strava/errors'
import { BACKFILL } from '@/config/strava'

const NOW = new Date('2026-10-23T10:00:00Z')

function activitiesFrom(count: number, firstDate = '2026-10-01T00:00:00Z') {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    start_date: new Date(Date.parse(firstDate) - index * 3600_000).toISOString(),
  }))
}

function makeDeps(pageResult: unknown[] = []) {
  return {
    listPendingJobs: vi
      .fn()
      .mockResolvedValue([{ memberId: 'm1', fromDate: '2025-01-01', cursorBefore: null, pagesDone: 0 }]),
    fetchPage: vi.fn().mockResolvedValue(pageResult),
    saveSummaries: vi.fn().mockResolvedValue(undefined),
    updateJob: vi.fn().mockResolvedValue(undefined),
    canSpend: vi.fn().mockResolvedValue(true),
    now: () => NOW,
  }
}

describe('backfillStartDate', () => {
  it('lấy 01/01 của năm trước', () => {
    expect(backfillStartDate(NOW)).toBe('2025-01-01')
  })
})

describe('runBackfill', () => {
  it('trang chưa đầy: lưu rồi đánh dấu xong', async () => {
    const page = activitiesFrom(3)
    const deps = makeDeps(page)

    await expect(runBackfill(deps)).resolves.toBe(1)

    expect(deps.fetchPage.mock.calls[0]![1].before).toEqual(NOW)
    expect(deps.saveSummaries).toHaveBeenCalledWith('m1', page)
    expect(deps.updateJob).toHaveBeenCalledWith('m1', expect.objectContaining({ status: 'done' }))
  })

  it('trang đầy: dời mốc về hoạt động cũ nhất và chưa xong', async () => {
    const page = activitiesFrom(BACKFILL.pageSize)
    const deps = makeDeps(page)

    await runBackfill(deps)

    const patch = deps.updateJob.mock.calls[0]![1]
    expect(patch.status).toBeUndefined()
    expect(patch.cursorBefore).toBe(page[page.length - 1]!.start_date)
    expect(patch.pagesDone).toBe(1)
  })

  it('lần sau chạy tiếp từ mốc đã lưu', async () => {
    const deps = makeDeps(activitiesFrom(2))
    deps.listPendingJobs.mockResolvedValue([
      { memberId: 'm1', fromDate: '2025-01-01', cursorBefore: '2026-03-01T00:00:00.000Z', pagesDone: 2 },
    ])

    await runBackfill(deps)

    expect(deps.fetchPage.mock.calls[0]![1].before).toEqual(new Date('2026-03-01T00:00:00.000Z'))
  })

  it('gần hết hạn mức: không gọi Strava, job giữ nguyên', async () => {
    const deps = makeDeps(activitiesFrom(3))
    deps.canSpend.mockResolvedValue(false)

    await expect(runBackfill(deps)).resolves.toBe(0)
    expect(deps.fetchPage).not.toHaveBeenCalled()
    expect(deps.updateJob).not.toHaveBeenCalled()
  })

  it('bị giới hạn tốc độ: dừng, không ghi lỗi vào job', async () => {
    const deps = makeDeps()
    deps.fetchPage.mockRejectedValue(new RateLimitedError(NOW))

    await runBackfill(deps)

    expect(deps.updateJob).not.toHaveBeenCalled()
  })

  it('thành viên mất kết nối: job thất bại', async () => {
    const deps = makeDeps()
    deps.fetchPage.mockRejectedValue(new StravaNotConnectedError('m1'))

    await runBackfill(deps)

    expect(deps.updateJob).toHaveBeenCalledWith('m1', expect.objectContaining({ status: 'failed' }))
  })
})
