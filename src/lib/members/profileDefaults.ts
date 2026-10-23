import type { CurrentMember } from '@/lib/auth/currentMember'

export function toProfileFormDefaults(member: CurrentMember) {
  return {
    display_name: member.display_name ?? '',
    gender: member.gender ?? '',
    birth_year: member.birth_year?.toString() ?? '',
    phone: member.phone ?? '',
  }
}
