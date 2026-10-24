export const PENALTY_TYPES = [
  {
    code: 'challenge_fail',
    name: 'Không đạt challenge',
    defaultAmount: 100000,
  },
  {
    code: 'challenge_low',
    name: 'Đạt dưới mức tối thiểu của challenge',
    defaultAmount: 200000,
  },
  {
    code: 'event_absent',
    name: 'Đăng ký event nhưng vắng',
    defaultAmount: 50000,
  },
  { code: 'rule_violation', name: 'Vi phạm quy chế', defaultAmount: 100000 },
  { code: 'other', name: 'Khác', defaultAmount: 0 },
] as const

export type PenaltyTypeCode = (typeof PENALTY_TYPES)[number]['code']

export const PENALTY_STATUSES = ['unpaid', 'paid', 'waived'] as const
export type PenaltyStatus = (typeof PENALTY_STATUSES)[number]

export const PENALTY_STATUS_LABELS: Record<PenaltyStatus, string> = {
  unpaid: 'Chưa nộp',
  paid: 'Đã nộp',
  waived: 'Được miễn',
}

export const PAYMENT_METHODS = ['cash', 'transfer', 'vietqr'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  vietqr: 'VietQR',
}

export const REWARD_STATUS_LABELS = {
  pending: 'Chờ trao',
  given: 'Đã trao',
} as const

export const PENALTY_LIST_LIMIT = 500

// Gợi ý nội dung chuyển khoản: mã thành viên + PHAT + tháng
export const TRANSFER_NOTE_PREFIX = 'PHAT'
