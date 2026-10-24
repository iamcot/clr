// Khai báo một lần các hình dùng chung; mỗi người chạy là một <use> trỏ tới đây, tô màu riêng bằng `color`
export default function DrawSprites() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <symbol id="sprite-runner" viewBox="0 0 64 64">
          <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none">
            <line className="sprite-swing-b" x1="34" y1="38" x2="34" y2="58" />
            <line x1="34" y1="22" x2="30" y2="40" />
            <line className="sprite-swing-a" x1="34" y1="38" x2="34" y2="58" />
            <line className="sprite-swing-a" x1="34" y1="24" x2="34" y2="40" />
            <line className="sprite-swing-b" x1="34" y1="24" x2="34" y2="40" />
          </g>
          <circle cx="38" cy="12" r="8" fill="currentColor" />
          <circle cx="41" cy="10" r="1.6" fill="var(--color-ink)" />
        </symbol>
        <symbol id="sprite-duck" viewBox="0 0 64 48">
          <g className="sprite-bob">
            <ellipse cx="30" cy="32" rx="22" ry="12" fill="currentColor" />
            <path d="M10 28c-5-3-7-8-6-11 5 0 9 3 12 8Z" fill="currentColor" />
            <circle cx="46" cy="18" r="11" fill="currentColor" />
            <path d="M54 19c5-1 8 1 9 3-3 3-7 3-10 2Z" fill="var(--color-danger)" />
            <circle cx="49" cy="15" r="2" fill="var(--color-ink)" />
            <path d="M5 42c6-3 8 2 14-1s9 2 15-1 9 2 15-1" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>
        </symbol>
      </defs>
    </svg>
  )
}
