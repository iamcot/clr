import { describe, expect, it, vi } from 'vitest'
import { runDetailBackfill } from '@/lib/strava/detailBackfill'
import { RateLimitedError, StravaApiError } from '@/lib/strava/errors'

function makeDeps() {
  return {
    listActivitiesWithoutDetail: vi.fn().mockResolvedValue([
      { id: 1, memberId: 'm1' },
      { id: 2, memberId: 'm1' },
    ]),
    fetchAndSaveDetail: vi.fn().mockResolvedValue(undefined),
    deleteMissingActivity: vi.fn().mockResolvedValue(undefined),
    canSpend: vi.fn().mockResolvedValue(true),
  }
}

describe('runDetailBackfill', () => {
  it('lấy chi tiết từng hoạt động', async () => {
    const deps = makeDeps()
    await expect(runDetailBackfill(deps, 10)).resolves.toBe(2)
  })

  it('dừng khi hết hạn mức', async () => {
    const deps = makeDeps()
    deps.canSpend.mockResolvedValueOnce(true).mockResolvedValue(false)
    await expect(runDetailBackfill(deps, 10)).resolves.toBe(1)
  })

  it('hoạt động đã bị xoá trên Strava (404): xoá khỏi DB và đi tiếp', async () => {
    const deps = makeDeps()
    deps.fetchAndSaveDetail.mockRejectedValueOnce(new StravaApiError(404, '/activities/1'))
    await expect(runDetailBackfill(deps, 10)).resolves.toBe(1)
    expect(deps.deleteMissingActivity).toHaveBeenCalledWith('m1', 1)
  })

  it('bị giới hạn tốc độ: dừng ngay', async () => {
    const deps = makeDeps()
    deps.fetchAndSaveDetail.mockRejectedValue(new RateLimitedError(new Date()))
    await expect(runDetailBackfill(deps, 10)).resolves.toBe(0)
    expect(deps.fetchAndSaveDetail).toHaveBeenCalledTimes(1)
  })
})
