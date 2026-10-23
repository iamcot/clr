import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12
const VERSION = 'v1'

function toKeyBuffer(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64')
  if (key.length !== KEY_BYTES) throw new Error('Khoá mã hoá phải là 32 byte (base64)')
  return key
}

export function seal(plainText: string, base64Key: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, toKeyBuffer(base64Key), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const parts = [VERSION, iv, cipher.getAuthTag(), encrypted]
  return parts.map((part) => (typeof part === 'string' ? part : part.toString('base64'))).join('.')
}

export function open(sealed: string, base64Key: string): string {
  const [version, iv, authTag, encrypted] = sealed.split('.')
  if (version !== VERSION || !iv || !authTag || !encrypted) throw new Error('Chuỗi mã hoá không hợp lệ')

  const decipher = createDecipheriv(ALGORITHM, toKeyBuffer(base64Key), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8')
}
