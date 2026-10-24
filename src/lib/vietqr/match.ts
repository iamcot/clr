export type IncomingTransfer = { direction: 'in' | 'out'; amount: number; content: string }

export type CandidateIntent = { id: string; ref: string; amount: number; status: string }

export type TransferMatch =
  | { kind: 'ignored' }
  | { kind: 'paid'; intentId: string }
  | { kind: 'mismatch'; intentId: string }
  | { kind: 'duplicate'; intentId: string }
  | { kind: 'member_hint'; memberCode: string }
  | { kind: 'none' }

const MEMBER_CODE_PATTERN = /CLR\d{4}/

// Ngân hàng hay chèn tiền tố ("MBVCB.123456."), đổi hoa thường, thêm hoặc bỏ khoảng trắng và dấu gạch
export function normalizeTransferContent(content: string): string {
  return content
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function findIntent(normalized: string, intents: CandidateIntent[]): CandidateIntent | null {
  const found = intents.filter((intent) => normalized.includes(intent.ref.toUpperCase()))
  return found.find((intent) => intent.status !== 'paid') ?? found[0] ?? null
}

export function matchTransfer(transfer: IncomingTransfer, intents: CandidateIntent[]): TransferMatch {
  if (transfer.direction === 'out') return { kind: 'ignored' }
  const normalized = normalizeTransferContent(transfer.content)

  const intent = findIntent(normalized, intents)
  if (intent) {
    if (intent.status === 'paid') return { kind: 'duplicate', intentId: intent.id }
    const exact = intent.status !== 'cancelled' && transfer.amount === intent.amount
    return exact ? { kind: 'paid', intentId: intent.id } : { kind: 'mismatch', intentId: intent.id }
  }

  const memberCode = MEMBER_CODE_PATTERN.exec(normalized)?.[0]
  return memberCode ? { kind: 'member_hint', memberCode } : { kind: 'none' }
}
