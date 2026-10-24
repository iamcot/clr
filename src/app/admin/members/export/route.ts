import { getBcnMember } from '@/lib/auth/requireBcn'
import { logAudit } from '@/lib/audit/logAudit'
import { toMembersCsv, type MemberCsvRow } from '@/lib/members/memberCsv'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const CSV_COLUMNS =
  'member_code, display_name, member_type, role, status, gender, birth_year, phone, joined_at' as const

export async function GET() {
  if (!(await getBcnMember())) return new Response('Not found', { status: 404 })

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('members').select(CSV_COLUMNS).order('member_code')
  if (error) return new Response('Không xuất được danh sách', { status: 500 })

  const rows: MemberCsvRow[] = data
  await logAudit({ action: 'export_members', targetTable: 'members', targetId: 'all', after: { count: rows.length } })

  return new Response(toMembersCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clr-members.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
