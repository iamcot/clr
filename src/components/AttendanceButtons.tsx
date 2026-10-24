import ActionForm from '@/components/ActionForm'
import { ATTENDANCE_LABELS, MEMBER_ATTENDANCE_CHOICES } from '@/config/events'
import { setAttendance } from '@/lib/events/memberActions'
import type { AttendanceStatus } from '@/lib/types/database'

type AttendanceButtonsProps = { eventId: string; current: AttendanceStatus | null }

function isSelected(choice: AttendanceStatus, current: AttendanceStatus | null): boolean {
  return choice === current || (choice === 'going' && current === 'waitlist')
}

export default function AttendanceButtons({ eventId, current }: AttendanceButtonsProps) {
  return (
    <div className="flex gap-2">
      {MEMBER_ATTENDANCE_CHOICES.map((choice) => (
        <ActionForm key={choice} action={setAttendance} className="flex-1">
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="status" value={choice} />
          <button
            type="submit"
            aria-pressed={isSelected(choice, current)}
            className={`min-h-12 w-full rounded-full font-bold ${
              isSelected(choice, current) ? 'bg-brand text-white' : 'border border-brand bg-white text-brand-dark'
            }`}
          >
            {choice === 'going' && current === 'waitlist' ? ATTENDANCE_LABELS.waitlist : ATTENDANCE_LABELS[choice]}
          </button>
        </ActionForm>
      ))}
    </div>
  )
}
