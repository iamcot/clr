import ActionForm from '@/components/ActionForm'
import { DRAW_SOURCE_LABELS, DRAW_SOURCE_TYPES } from '@/config/draw'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createDraw } from '@/lib/draw/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const SOURCE_LIST_LIMIT = 50

async function loadSources() {
  const supabase = await createSupabaseServerClient()
  const [challenges, events] = await Promise.all([
    supabase.from('challenges').select('id, title').neq('status', 'draft').order('ends_at', { ascending: false }).limit(SOURCE_LIST_LIMIT),
    supabase.from('events').select('id, title').neq('status', 'draft').order('starts_at', { ascending: false }).limit(SOURCE_LIST_LIMIT),
  ])
  return { challenges: challenges.data ?? [], events: events.data ?? [] }
}

export default async function NewDrawPage() {
  await requireBcn()
  const { challenges, events } = await loadSources()

  return (
    <section>
      <h1 className="text-2xl font-black">Tạo đợt quay số</h1>
      <ActionForm action={createDraw} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-bold">Tên đợt quay số</span>
          <input name="title" required className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">Nguồn danh sách</span>
          <select name="source_type" defaultValue="challenge_completed" className={INPUT_CLASS}>
            {DRAW_SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {DRAW_SOURCE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">Challenge (khi chọn nguồn challenge)</span>
          <select name="challenge_id" defaultValue="" className={INPUT_CLASS}>
            <option value="">Không chọn</option>
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">Event (khi chọn nguồn event)</span>
          <select name="event_id" defaultValue="" className={INPUT_CLASS}>
            <option value="">Không chọn</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold">Các giải</span>
          <span className="text-sm text-muted">Mỗi giải một dòng, dạng “Tên giải | số lượng”. Quay theo thứ tự từ trên xuống.</span>
          <textarea
            name="prizes"
            required
            rows={5}
            placeholder={'Giải khuyến khích: tất | 5\nGiải nhất: giày | 1'}
            className="w-full rounded-lg border border-line bg-white p-3"
          />
        </label>
        <button type="submit" className="min-h-12 rounded-full bg-brand font-bold text-white">
          Tạo và chọn danh sách
        </button>
      </ActionForm>
    </section>
  )
}
