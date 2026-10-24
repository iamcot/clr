import { MEMBER_STATUSES, MEMBER_TYPES } from '@/config/members'
import { GENDER_OPTIONS } from '@/config/profile'
import type { Gender, MemberStatus, MemberType } from '@/lib/types/database'

export type MemberFilter = {
  status: MemberStatus
  search: string
  type: MemberType | null
  gender: Gender | null
}

type RawFilter = Partial<Record<'status' | 'q' | 'type' | 'gender', string>>

const DEFAULT_STATUS: MemberStatus = 'pending'
const SEARCH_MAX_LENGTH = 50
const GENDERS: string[] = GENDER_OPTIONS.map((option) => option.value)

function pickOne<T extends string>(allowed: readonly string[], value: string | undefined): T | null {
  return value && allowed.includes(value) ? (value as T) : null
}

export function parseMemberFilter(raw: RawFilter): MemberFilter {
  return {
    status: pickOne<MemberStatus>(MEMBER_STATUSES, raw.status) ?? DEFAULT_STATUS,
    search: (raw.q ?? '').trim().slice(0, SEARCH_MAX_LENGTH),
    type: pickOne<MemberType>(MEMBER_TYPES, raw.type),
    gender: pickOne<Gender>(GENDERS, raw.gender),
  }
}

export function toLikePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`
}
