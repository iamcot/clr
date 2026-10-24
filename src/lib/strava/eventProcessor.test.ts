import { describe, expect, it, vi } from 'vitest'
import { processStravaEvent, type StravaEvent } from '@/lib/strava/eventProcessor'

function makeDeps(memberId: string | null = 'm1') {
  return {
    findMemberIdByAthleteId: vi.fn().mockResolvedValue(memberId),
    fetchActivity: vi.fn().mockResolvedValue({ id: 99 }),
    saveActivity: vi.fn().mockResolvedValue(undefined),
    deleteActivity: vi.fn().mockResolvedValue(undefined),
    disconnectMember: vi.fn().mockResolvedValue(undefined),
  }
}

const activityEvent = (aspect: string): StravaEvent => ({
  object_type: 'activity',
  object_id: 99,
  aspect_type: aspect,
  owner_id: 7,
  updates: {},
})

describe('processStravaEvent', () => {
  it('create: lấy chi tiết và lưu hoạt động', async () => {
    const deps = makeDeps()
    await expect(processStravaEvent(deps, activityEvent('create'))).resolves.toBe('processed')
    expect(deps.fetchActivity).toHaveBeenCalledWith('m1', 99)
    expect(deps.saveActivity).toHaveBeenCalledWith('m1', { id: 99 })
  })

  it('update: lấy lại chi tiết để đổi tên, riêng tư...', async () => {
    const deps = makeDeps()
    await processStravaEvent(deps, activityEvent('update'))
    expect(deps.saveActivity).toHaveBeenCalledTimes(1)
  })

  it('delete: xoá hoạt động, không gọi Strava', async () => {
    const deps = makeDeps()
    await processStravaEvent(deps, activityEvent('delete'))
    expect(deps.deleteActivity).toHaveBeenCalledWith('m1', 99)
    expect(deps.fetchActivity).not.toHaveBeenCalled()
  })

  it('chủ hoạt động không phải thành viên: bỏ qua', async () => {
    const deps = makeDeps(null)
    await expect(processStravaEvent(deps, activityEvent('create'))).resolves.toBe('ignored')
    expect(deps.fetchActivity).not.toHaveBeenCalled()
  })

  it('athlete thu hồi quyền: ngắt kết nối thành viên', async () => {
    const deps = makeDeps()
    const event = {
      object_type: 'athlete',
      object_id: 7,
      aspect_type: 'update',
      owner_id: 7,
      updates: { authorized: 'false' },
    }
    await expect(processStravaEvent(deps, event)).resolves.toBe('processed')
    expect(deps.disconnectMember).toHaveBeenCalledWith('m1')
  })

  it('athlete update khác (không phải thu hồi): bỏ qua', async () => {
    const deps = makeDeps()
    const event = { object_type: 'athlete', object_id: 7, aspect_type: 'update', owner_id: 7, updates: { title: 'x' } }
    await expect(processStravaEvent(deps, event)).resolves.toBe('ignored')
    expect(deps.disconnectMember).not.toHaveBeenCalled()
  })
})
