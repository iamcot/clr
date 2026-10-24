import { describe, expect, it } from 'vitest'
import { decodePolyline, polylineToSvgPath } from '@/lib/stats/routeShape'

describe('decodePolyline', () => {
  it('giải mã ví dụ chuẩn của Google', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
    expect(points).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ])
  })

  it('chuỗi rỗng không có điểm', () => {
    expect(decodePolyline('')).toEqual([])
  })
})

describe('polylineToSvgPath', () => {
  it('trả chuỗi rỗng khi có dưới hai điểm', () => {
    expect(polylineToSvgPath([{ lat: 1, lng: 1 }], 100, 5)).toBe('')
  })

  it('tạo path nằm trong khung', () => {
    const path = polylineToSvgPath(
      [
        { lat: 10, lng: 106 },
        { lat: 10.01, lng: 106.01 },
      ],
      100,
      5,
    )
    expect(path.startsWith('M')).toBe(true)
    const numbers = path.match(/[\d.]+/g)?.map(Number) ?? []
    expect(numbers.every((value) => value >= 0 && value <= 100)).toBe(true)
  })
})
