import { describe, expect, it } from 'vitest'
import { toMembersCsv, type MemberCsvRow } from '@/lib/members/memberCsv'

const BASE_ROW: MemberCsvRow = {
  member_code: 'CLR0001',
  display_name: 'Lan',
  member_type: 'official',
  role: 'member',
  status: 'active',
  gender: 'F',
  birth_year: 1990,
  phone: '0912345678',
  joined_at: '2026-10-01T03:00:00Z',
}

describe('toMembersCsv', () => {
  it('có BOM, dòng tiêu đề và dòng dữ liệu', () => {
    const lines = toMembersCsv([BASE_ROW]).split('\r\n')
    expect(lines[0]).toBe('﻿Mã,Tên,Loại,Vai trò,Trạng thái,Giới tính,Năm sinh,SĐT,Ngày vào')
    expect(lines[1]).toBe('CLR0001,Lan,Chính thức,Thành viên,Đang hoạt động,F,1990,0912345678,2026-10-01')
  })

  it('bọc dấu phẩy, nháy kép và xuống dòng trong ngoặc kép', () => {
    const csv = toMembersCsv([{ ...BASE_ROW, display_name: 'A, "B"\nC' }])
    expect(csv).toContain('"A, ""B""\nC"')
  })

  it('chặn công thức Excel ở đầu ô', () => {
    const csv = toMembersCsv([{ ...BASE_ROW, display_name: '=HYPERLINK("x")', phone: null, member_type: null }])
    const expectedCell = ['"', "'", '=HYPERLINK(""x"")', '"'].join('')
    expect(csv).toContain(expectedCell)
  })
})
