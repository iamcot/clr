function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`)
  return value
}

export function getSupabaseUrl() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabasePublishableKey() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
}

export function getSupabaseSecretKey() {
  return requireEnv('SUPABASE_SECRET_KEY')
}
