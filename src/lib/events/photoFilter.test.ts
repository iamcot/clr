import { describe, expect, it } from 'vitest'
import { filterMyPhotos } from '@/lib/events/photoFilter'

describe('filterMyPhotos', () => {
  it('giữ ảnh mình upload hoặc được gắn tên', () => {
    const photos = [
      { id: 'a', uploadedByMe: true, taggedMe: false },
      { id: 'b', uploadedByMe: false, taggedMe: true },
      { id: 'c', uploadedByMe: false, taggedMe: false },
    ]
    expect(filterMyPhotos(photos).map((photo) => photo.id)).toEqual(['a', 'b'])
  })
})
