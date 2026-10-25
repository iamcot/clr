import { describe, expect, it } from 'vitest'
import { describePage, hrefWithPage, pageRange, parsePage, slicePage } from '@/lib/admin/pagination'

describe('parsePage', () => {
  it('mặc định trang 1 khi thiếu hoặc sai', () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('abc')).toBe(1)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-3')).toBe(1)
  })

  it('đọc số trang hợp lệ', () => {
    expect(parsePage('4')).toBe(4)
  })
})

describe('pageRange', () => {
  it('tính chỉ số theo trang', () => {
    expect(pageRange(1, 30)).toEqual({ from: 0, to: 29 })
    expect(pageRange(3, 30)).toEqual({ from: 60, to: 89 })
  })
})

describe('describePage', () => {
  it('kéo trang vượt quá về trang cuối', () => {
    expect(describePage(99, 65, 30).page).toBe(3)
    expect(describePage(1, 0, 30).totalPages).toBe(1)
  })
})

describe('slicePage', () => {
  it('cắt đúng dòng của trang', () => {
    const rows = Array.from({ length: 65 }, (_, index) => index)
    const result = slicePage(rows, 3, 30)
    expect(result.rows).toEqual([60, 61, 62, 63, 64])
    expect(result.window.total).toBe(65)
  })
})

describe('hrefWithPage', () => {
  it('giữ tham số lọc, bỏ page cũ, không ghi page=1', () => {
    expect(hrefWithPage('/admin/x', { q: 'a', page: '5', m: ['1', '2'] }, 1)).toBe('/admin/x?q=a&m=1&m=2')
    expect(hrefWithPage('/admin/x', { q: 'a' }, 3)).toBe('/admin/x?q=a&page=3')
    expect(hrefWithPage('/admin/x', {}, 1)).toBe('/admin/x')
  })
})
