import { describe, expect, it } from 'vitest'
import { scaleToFit } from '@/lib/storage/prepareImage'

describe('scaleToFit', () => {
  it('giữ nguyên ảnh nhỏ hơn giới hạn', () => {
    expect(scaleToFit(1600, 900, 2048)).toEqual({ width: 1600, height: 900 })
  })

  it('thu cạnh dài về giới hạn, giữ tỉ lệ', () => {
    expect(scaleToFit(4032, 3024, 2048)).toEqual({ width: 2048, height: 1536 })
    expect(scaleToFit(3024, 4032, 480)).toEqual({ width: 360, height: 480 })
  })
})
