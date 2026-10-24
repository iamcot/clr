import 'server-only'
import { ACK_LIST_LIMIT, POST_ADMIN_LIST_LIMIT } from '@/config/posts'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AdminPostRow = {
  id: string
  title: string
  kind: string
  pinned: boolean
  requireAck: boolean
  publishedAt: string | null
}

export type AckStats = {
  activeMembers: number
  readCount: number
  ackedCount: number
  notAcked: { memberId: string; displayName: string; memberCode: string; read: boolean }[]
}

export async function loadAdminPosts(): Promise<AdminPostRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('posts')
    .select('id, title, kind, pinned, require_ack, published_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(POST_ADMIN_LIST_LIMIT)
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind,
    pinned: row.pinned,
    requireAck: row.require_ack,
    publishedAt: row.published_at,
  }))
}

export async function loadAdminPost(postId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('posts').select('*').eq('id', postId).is('deleted_at', null).maybeSingle()
  return data
}

export async function loadAckStats(postId: string): Promise<AckStats> {
  const supabase = await createSupabaseServerClient()
  const [members, reads] = await Promise.all([
    supabase
      .from('members')
      .select('id, display_name, member_code')
      .eq('status', 'active')
      .order('display_name')
      .range(0, ACK_LIST_LIMIT - 1),
    supabase
      .from('post_reads')
      .select('member_id, acked_at')
      .eq('post_id', postId)
      .range(0, ACK_LIST_LIMIT - 1),
  ])
  const readByMember = new Map((reads.data ?? []).map((row) => [row.member_id, row.acked_at]))
  const activeMembers = members.data ?? []
  const notAcked = activeMembers
    .filter((member) => readByMember.get(member.id) == null)
    .map((member) => ({
      memberId: member.id,
      displayName: member.display_name ?? 'Thành viên',
      memberCode: member.member_code,
      read: readByMember.has(member.id),
    }))
  return {
    activeMembers: activeMembers.length,
    readCount: activeMembers.filter((member) => readByMember.has(member.id)).length,
    ackedCount: activeMembers.filter((member) => readByMember.get(member.id) != null).length,
    notAcked,
  }
}
