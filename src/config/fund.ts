export const PAYMENT_INTENT_TTL_HOURS = 24

// Khớp hàm random_payment_ref() ở migration 0022: không dùng O, 0, I, 1 để khỏi nhầm khi đọc
export const PAYMENT_REF_LENGTH = 6
export const PAYMENT_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Nội dung chuyển khoản tối đa theo chuẩn VietQR (trường addInfo)
export const TRANSFER_NOTE_MAX_LENGTH = 25

// Màn chờ hỏi trạng thái lần nộp theo chu kỳ này (không dùng Realtime vì chưa chắc phía thành viên nhận được)
export const PAYMENT_POLL_MS = 3000

// Chỉ đối soát với các lần nộp tạo trong khoảng này
export const MATCH_LOOKBACK_DAYS = 30

export const BANK_EVENT_STATUS_LABELS = {
  received: 'Chưa xử lý',
  paid: 'Đã khớp',
  mismatch: 'Lệch tiền',
  needs_review: 'Chờ xử lý tay',
  unmatched: 'Chưa phân loại',
  duplicate: 'Nộp trùng',
  ignored: 'Tiền ra',
  resolved: 'Đã ghép tay',
} as const

export type BankEventStatus = keyof typeof BANK_EVENT_STATUS_LABELS

export const INTENT_STATUS_LABELS = {
  pending: 'Chờ chuyển khoản',
  paid: 'Đã nhận tiền',
  expired: 'Hết hạn',
  mismatch: 'Lệch tiền',
  cash_pending: 'Chờ thủ quỹ xác nhận tiền mặt',
  cancelled: 'Đã huỷ',
} as const

export type IntentStatus = keyof typeof INTENT_STATUS_LABELS

export const FUND_DIRECTION_LABELS = { in: 'Thu', out: 'Chi' } as const
export type FundDirection = keyof typeof FUND_DIRECTION_LABELS

export const RECENT_TRANSACTIONS_LIMIT = 50
export const QUEUE_LIMIT = 50

// Mã BIN Napas của các ngân hàng phổ biến, dùng làm bank_bin trong mã VietQR
export const BANKS = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970448', name: 'OCB' },
  { bin: '970426', name: 'MSB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970454', name: 'Bản Việt (VietCapital)' },
  { bin: '970429', name: 'SCB' },
] as const
