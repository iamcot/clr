import Link from 'next/link'
import EventForm from '@/components/EventForm'

export default function NewEventPage() {
  return (
    <section>
      <Link href="/admin/events" className="text-sm text-muted underline">
        ← Event
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-black">Tạo event</h1>
      <EventForm defaults={{ kind: 'group_run', status: 'draft' }} />
    </section>
  )
}
