// Chênh lệch đồng hồ server - client, lấy mốc giữa lúc gửi và lúc nhận để bù độ trễ mạng một chiều
export function estimateClockOffset(serverNowMs: number, requestSentMs: number, responseReceivedMs: number): number {
  return serverNowMs - (requestSentMs + responseReceivedMs) / 2
}

// Giữ ước lượng của lần hỏi có độ trễ khứ hồi thấp nhất vì sai số tối đa bằng nửa độ trễ đó
export function pickBetterOffset(
  current: { offsetMs: number; roundTripMs: number } | null,
  candidate: { offsetMs: number; roundTripMs: number },
): { offsetMs: number; roundTripMs: number } {
  return current && current.roundTripMs <= candidate.roundTripMs ? current : candidate
}
