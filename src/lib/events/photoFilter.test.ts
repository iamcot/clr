import { describe, expect, it } from 'vitest'
import { filterMyPhotos } from '@/lib/events/photoFilter'

describe('filterMyPhotos', () => {
  it('chỉ giữ ảnh được gắn tên mình, kể cả ảnh mình upload mà chưa gắn thì bỏ', () => {
    const photos = [
      { id: 'a', taggedMe: false },
      { id: 'b', taggedMe: true },
    ]
    expect(filterMyPhotos(photos).map((photo) => photo.id)).toEqual(['b'])
  })
})
