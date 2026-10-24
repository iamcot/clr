import { TRANSFER_NOTE_MAX_LENGTH } from '@/config/fund'

export type VietQrInput = {
  bankBin: string
  accountNo: string
  amount: number
  addInfo: string
}

const NAPAS_GUID = 'A000000727'
const SERVICE_TO_ACCOUNT = 'QRIBFTTA'
const COUNTRY_CODE = 'VN'
const CURRENCY_VND = '704'
const CRC_POLYNOMIAL = 0x1021
const CRC_INIT = 0xffff
const MAX_AMOUNT_DIGITS = 13

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

// CRC-16/CCITT-FALSE: đa thức 0x1021, khởi tạo 0xFFFF; kết quả 4 ký tự hoa
export function crc16(text: string): string {
  let crc = CRC_INIT
  for (const char of text) {
    crc ^= char.charCodeAt(0) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC_POLYNOMIAL) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Nhiều ngân hàng cắt hoặc đổi dấu và ký tự lạ nên chỉ giữ chữ không dấu, số và khoảng trắng
export function sanitizeTransferNote(note: string): string {
  return note
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TRANSFER_NOTE_MAX_LENGTH)
}

// Nội dung chuyển khoản của một lần nộp: 'CLR0123 AB3K9X'
export function paymentTransferNote(memberCode: string, ref: string): string {
  return sanitizeTransferNote(`${memberCode} ${ref}`)
}

// Chuỗi VietQR chuyển tới tài khoản (Napas 247), có sẵn số tiền và nội dung
export function buildVietQrPayload({ bankBin, accountNo, amount, addInfo }: VietQrInput): string {
  if (!/^\d{6}$/.test(bankBin)) throw new Error('Mã BIN ngân hàng gồm 6 chữ số')
  if (!/^[0-9A-Za-z]{4,19}$/.test(accountNo)) throw new Error('Số tài khoản không hợp lệ')
  if (!Number.isInteger(amount) || amount <= 0 || String(amount).length > MAX_AMOUNT_DIGITS) {
    throw new Error('Số tiền không hợp lệ')
  }
  const consumer = tlv('00', bankBin) + tlv('01', accountNo)
  const merchantInfo = tlv('00', NAPAS_GUID) + tlv('01', consumer) + tlv('02', SERVICE_TO_ACCOUNT)
  const note = sanitizeTransferNote(addInfo)
  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('38', merchantInfo) +
    tlv('53', CURRENCY_VND) +
    tlv('54', String(amount)) +
    tlv('58', COUNTRY_CODE) +
    (note ? tlv('62', tlv('08', note)) : '') +
    '6304'
  return body + crc16(body)
}
