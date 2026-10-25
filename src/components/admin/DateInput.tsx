import { ADMIN_INPUT_CLASS } from '@/components/admin/styles'

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type: 'date' | 'month' | 'datetime-local'
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted',
} as const

function CalendarIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}

// Safari trên iPhone vẽ ô ngày kiểu riêng (trống, rộng lệch); appearance-none và căn trái giúp ô cân với các ô còn lại.
// Icon lịch gốc của Chrome được trải kín ô và ẩn đi để bấm đâu cũng mở bộ chọn mà không trùng icon của mình
const INPUT_CLASS = `${ADMIN_INPUT_CLASS} relative block min-w-0 max-w-full appearance-none pl-9 text-left [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-date-and-time-value]:min-h-[1.5em] [&::-webkit-date-and-time-value]:text-left`

export default function DateInput({ className = '', ...props }: DateInputProps) {
  return (
    <div className="relative min-w-0">
      <input {...props} className={`${INPUT_CLASS} ${className}`} />
      <CalendarIcon />
    </div>
  )
}
