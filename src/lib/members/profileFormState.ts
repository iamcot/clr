import type { ProfileField } from '@/lib/members/profileInput'

export type ProfileFormState = {
  errors: Partial<Record<ProfileField | 'form', string>>
  values: Partial<Record<ProfileField, string>>
}

export const EMPTY_PROFILE_FORM_STATE: ProfileFormState = { errors: {}, values: {} }
