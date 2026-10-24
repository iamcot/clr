import { getBcnMember } from '@/lib/auth/requireBcn'
import { logAudit } from '@/lib/audit/logAudit'
import { csvResponse, toCsv } from '@/lib/format/csv'
import { loadAckStats } from '@/lib/posts/loadAdminPosts'

const HEADERS = ['Mã', 'Tên', 'Đã mở đọc']

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getBcnMember())) return new Response('Not found', { status: 404 })
  const { id } = await params
  const stats = await loadAckStats(id)
  const rows = stats.notAcked.map((member) => [member.memberCode, member.displayName, member.read ? 'Có' : 'Không'])
  await logAudit({ action: 'export_post_not_acked', targetTable: 'posts', targetId: id, after: { count: rows.length } })
  return csvResponse(toCsv(HEADERS, rows), `clr-post-${id}-chua-xac-nhan.csv`)
}
