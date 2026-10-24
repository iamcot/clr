import AdminPageHeader from '@/components/admin/AdminPageHeader'
import EventForm from '@/components/EventForm'

export default function NewEventPage() {
  return (
    <section>
      <AdminPageHeader title="Tạo event" backHref="/admin/events" backLabel="Event" />
      <EventForm defaults={{ kind: 'group_run', status: 'draft' }} />
    </section>
  )
}
