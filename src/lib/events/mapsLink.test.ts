import { describe, expect, it } from 'vitest'
import { googleMapsUrl } from '@/lib/events/mapsLink'

describe('googleMapsUrl', () => {
  it('ưu tiên toạ độ', () => {
    expect(googleMapsUrl({ lat: 21.0285, lng: 105.8542, name: 'Hồ Gươm' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=21.0285%2C105.8542',
    )
  })

  it('không có toạ độ thì dùng tên địa điểm', () => {
    expect(googleMapsUrl({ lat: null, lng: null, name: 'Cổng chính Celadon' })).toContain('C%E1%BB%95ng')
  })

  it('không có gì thì không có link', () => {
    expect(googleMapsUrl({ lat: null, lng: null, name: '  ' })).toBeNull()
  })
})
