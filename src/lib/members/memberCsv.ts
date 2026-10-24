import { MEMBER_ROLE_LABELS, MEMBER_STATUS_LABELS, MEMBER_TYPE_LABELS } from '@/config/members'
import type { Gender, MemberRole, MemberStatus, MemberType } from '@/lib/types/database'

export type MemberCsvRow = {
  member_code: string
  display_name: string | null
  member_type: MemberType | null
  role: MemberRole
  status: MemberStatus
  gender: Gender | null
  birth_year: number | null
  phone: string | null
  joined_at: string | null
}

const UTF8_BOM = '﻿'
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r']

const HEADERS = ['Mã', 'Tên', 'Loại', 'Vai trò', 'Trạng thái', 'Giới tính', 'Năm sinh', 'SĐT', 'Ngày vào']

function formatCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  const safeText = FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix)) ? `'${text}` : text
  return /[",\n\r]/.test(safeText) ? `"${safeText.replace(/"/g, '""')}"` : safeText
}

function formatJoinedDate(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export function toMembersCsv(rows: MemberCsvRow[]): string {
  const lines = rows.map((row) =>
    [
      row.member_code,
      row.display_name,
      row.member_type ? MEMBER_TYPE_LABELS[row.member_type] : null,
      MEMBER_ROLE_LABELS[row.role],
      MEMBER_STATUS_LABELS[row.status],
      row.gender,
      row.birth_year,
      row.phone,
      formatJoinedDate(row.joined_at),
    ]
      .map(formatCell)
      .join(','),
  )
  return UTF8_BOM + [HEADERS.join(','), ...lines].join('\r\n')
}
