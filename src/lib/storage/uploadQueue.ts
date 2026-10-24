// Chạy tối đa `limit` việc song song, giữ nguyên thứ tự kết quả
export async function runWithConcurrency<Item, Result>(
  items: readonly Item[],
  limit: number,
  worker: (item: Item, index: number) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length)
  let next = 0

  async function runLane() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await worker(items[index] as Item, index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runLane))
  return results
}

export class NonRetryableError extends Error {}

// Thử lại khi lỗi mạng; lỗi NonRetryableError (ví dụ file bị từ chối) thì dừng ngay
export async function withRetries<Result>(
  task: () => Promise<Result>,
  retries: number,
  delayMs: number,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<Result> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      if (error instanceof NonRetryableError || attempt >= retries) throw error
      await sleep(delayMs * (attempt + 1))
    }
  }
}
