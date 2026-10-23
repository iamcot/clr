export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`)
  return value
}

export function getAppUrl() {
  return requireEnv('APP_URL').replace(/\/$/, '')
}
