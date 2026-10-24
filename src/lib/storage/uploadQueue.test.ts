import { describe, expect, it } from 'vitest'
import { NonRetryableError, runWithConcurrency, withRetries } from '@/lib/storage/uploadQueue'

const noSleep = async () => {}

describe('runWithConcurrency', () => {
  it('không chạy quá giới hạn song song và giữ thứ tự kết quả', async () => {
    let running = 0
    let peak = 0
    const results = await runWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (item) => {
      running += 1
      peak = Math.max(peak, running)
      await Promise.resolve()
      await Promise.resolve()
      running -= 1
      return item * 2
    })
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14])
    expect(peak).toBeLessThanOrEqual(3)
  })

  it('danh sách rỗng thì trả mảng rỗng', async () => {
    expect(await runWithConcurrency([], 3, async () => 1)).toEqual([])
  })
})

describe('withRetries', () => {
  it('thử lại tới khi thành công', async () => {
    let calls = 0
    const result = await withRetries(
      async () => {
        calls += 1
        if (calls < 3) throw new Error('mạng lỗi')
        return 'ok'
      },
      2,
      10,
      noSleep,
    )
    expect(result).toBe('ok')
    expect(calls).toBe(3)
  })

  it('hết lượt thử thì ném lỗi cuối', async () => {
    await expect(withRetries(async () => Promise.reject(new Error('hỏng')), 1, 10, noSleep)).rejects.toThrow('hỏng')
  })

  it('lỗi không thể thử lại thì dừng ngay', async () => {
    let calls = 0
    await expect(
      withRetries(
        async () => {
          calls += 1
          throw new NonRetryableError('bị từ chối')
        },
        3,
        10,
        noSleep,
      ),
    ).rejects.toThrow('bị từ chối')
    expect(calls).toBe(1)
  })
})
