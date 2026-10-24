export const ADMIN_USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/
export const ADMIN_PASSWORD_MIN_LENGTH = 10
export const ADMIN_PASSWORD_MAX_LENGTH = 72

export function normalizeAdminUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function validateAdminUsername(username: string): string | null {
  if (ADMIN_USERNAME_PATTERN.test(username)) return null
  return 'Tên đăng nhập 3-32 ký tự, chỉ gồm chữ thường, số, dấu chấm, gạch ngang và gạch dưới'
}

export function validateAdminPassword(password: string): string | null {
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `Mật khẩu cần ít nhất ${ADMIN_PASSWORD_MIN_LENGTH} ký tự`
  }
  if (password.length > ADMIN_PASSWORD_MAX_LENGTH) {
    return `Mật khẩu tối đa ${ADMIN_PASSWORD_MAX_LENGTH} ký tự`
  }
  return null
}
