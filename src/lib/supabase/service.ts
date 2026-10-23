import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/lib/supabase/env'

export function createSupabaseServiceClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
