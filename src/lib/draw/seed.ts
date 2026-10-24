const HEX_RADIX = 16

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(HEX_RADIX).padStart(2, '0')).join('')
}

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return new Uint8Array(digest)
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await sha256(text))
}

export function generateSeed(byteCount: number): string {
  return toHex(globalThis.crypto.getRandomValues(new Uint8Array(byteCount)))
}

// 4 byte đầu của sha256(seed) làm hạt giống cho PRNG; server và trang verify dùng chung hàm này
export async function deriveSeedNumber(seed: string): Promise<number> {
  const bytes = await sha256(seed)
  return new DataView(bytes.buffer).getUint32(0, false)
}
