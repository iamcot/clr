import { requireEnv } from '@/lib/env'

export function getSupabaseUrl() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabasePublishableKey() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
}

export function getSupabaseSecretKey() {
  return requireEnv('SUPABASE_SECRET_KEY')
}
