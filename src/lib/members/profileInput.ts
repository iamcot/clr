import {
  DISPLAY_NAME_MAX_LENGTH,
  GENDER_OPTIONS,
  MIN_AGE_YEARS,
  MIN_BIRTH_YEAR,
  PHONE_PATTERN,
} from '@/config/profile'

type FieldSource = { get(name: string): unknown }

export type ProfileInput = {
  display_name: string
  gender: 'M' | 'F' | 'X' | null
  birth_year: number | null
  phone: string | null
}

export type ProfileField = keyof ProfileInput

export type ProfileParseResult =
  | { ok: true; value: ProfileInput }
  | { ok: false; errors: Partial<Record<ProfileField, string>> }

function readText(source: FieldSource, name: string): string {
  const value = source.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function parseDisplayName(text: string): string | Error {
  if (!text) return new Error('Vui lòng nhập tên hiển thị')
  if (text.length > DISPLAY_NAME_MAX_LENGTH) return new Error(`Tên tối đa ${DISPLAY_NAME_MAX_LENGTH} ký tự`)
  return text
}

function parseGender(text: string): ProfileInput['gender'] | Error {
  if (!text) return null
  const option = GENDER_OPTIONS.find((candidate) => candidate.value === text)
  return option ? option.value : new Error('Giới tính không hợp lệ')
}

function parseBirthYear(text: string, currentYear: number): number | null | Error {
  if (!text) return null
  const year = Number(text)
  const maxYear = currentYear - MIN_AGE_YEARS
  if (!Number.isInteger(year) || year < MIN_BIRTH_YEAR || year > maxYear) {
    return new Error(`Năm sinh từ ${MIN_BIRTH_YEAR} đến ${maxYear}`)
  }
  return year
}

function parsePhone(text: string): string | null | Error {
  if (!text) return null
  const digits = text.replace(/[\s.-]/g, '')
  return PHONE_PATTERN.test(digits) ? digits : new Error('Số điện thoại chưa đúng')
}

export function parseProfileInput(source: FieldSource, currentYear: number): ProfileParseResult {
  const parsed = {
    display_name: parseDisplayName(readText(source, 'display_name')),
    gender: parseGender(readText(source, 'gender')),
    birth_year: parseBirthYear(readText(source, 'birth_year'), currentYear),
    phone: parsePhone(readText(source, 'phone')),
  }

  const errors: Partial<Record<ProfileField, string>> = {}
  for (const [field, value] of Object.entries(parsed)) {
    if (value instanceof Error) errors[field as ProfileField] = value.message
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return { ok: true, value: parsed as ProfileInput }
}
