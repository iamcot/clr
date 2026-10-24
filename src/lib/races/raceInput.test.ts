import { describe, expect, it } from 'vitest'
import { matchPrDistanceName, parseRaceResultInput } from '@/lib/races/raceInput'

function formOf(values: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

const VALID = {
  race_name: 'VnExpress Marathon Huế 2026',
  race_date: '2026-04-12',
  distance: 'half-marathon',
  chip_time: '1:45:12',
}

describe('parseRaceResultInput', () => {
  it('đọc kết quả hợp lệ với cự ly có sẵn', () => {
    const result = parseRaceResultInput(formOf(VALID))
    expect(result).toMatchObject({
      ok: true,
      value: { distanceLabel: 'Half-Marathon', distanceMeters: 21097, chipTimeSeconds: 6312 },
    })
  })

  it('cho nhập cự ly khác bằng tên và số km', () => {
    const result = parseRaceResultInput(
      formOf({ ...VALID, distance: 'custom', distance_label: '15K', distance_km: '15' }),
    )
    expect(result).toMatchObject({ ok: true, value: { distanceLabel: '15K', distanceMeters: 15000 } })
  })

  it('báo lỗi từng trường', () => {
    const result = parseRaceResultInput(formOf({ race_name: '', race_date: '', distance: 'custom', chip_time: '99' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.errors).sort()).toEqual(
      ['chip_time', 'distance_km', 'distance_label', 'race_date', 'race_name'].sort(),
    )
  })

  it('từ chối link không phải http', () => {
    const result = parseRaceResultInput(formOf({ ...VALID, certificate_url: 'javascript:alert(1)' }))
    expect(result.ok).toBe(false)
  })
})

describe('matchPrDistanceName', () => {
  it('khớp nhãn cự ly với tên PR', () => {
    expect(matchPrDistanceName('Half-Marathon')).toBe('half-marathon')
    expect(matchPrDistanceName('15K')).toBeNull()
  })
})
