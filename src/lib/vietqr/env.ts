import { requireEnv } from '@/lib/env'

export function getSepayApiKey() {
  return requireEnv('SEPAY_API_KEY')
}
