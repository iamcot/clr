import BackLink from '@/components/BackLink'
import EventForm from '@/components/EventForm'

export default function NewEventPage() {
  return (
    <section>
      <BackLink href="/admin/events">Event</BackLink>
      <h1 className="mt-2 mb-4 text-2xl font-black">Tạo event</h1>
      <EventForm defaults={{ kind: 'group_run', status: 'draft' }} />
    </section>
  )
}
