export function pickTab<T extends string>(allowed: readonly T[], value: string | undefined, fallback: T): T {
  return allowed.find((tab) => tab === value) ?? fallback
}
