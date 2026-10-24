import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/types/database'

type AuditEntry = {
  action: string
  targetTable: string
  targetId: string
  before?: Json
  after?: Json
}

export async function logAudit({ action, targetTable, targetId, before = null, after = null }: AuditEntry) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('log_audit', {
    p_action: action,
    p_target_table: targetTable,
    p_target_id: targetId,
    p_before: before,
    p_after: after,
  })
  if (error) throw new Error(`Không ghi được nhật ký: ${error.message}`)
}
