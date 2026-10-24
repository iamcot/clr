import ActionForm from '@/components/ActionForm'
import { DRAW_SOURCE_LABELS, DRAW_SOURCE_TYPES, DRAW_STYLE_CONFIG, DRAW_STYLES } from '@/config/draw'
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

function SourcePicker({ legend, name, options }: { legend: string; name: string; options: { id: string; title: string }[] }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-bold">{legend}</legend>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-line bg-white">
        {options.map((option) => (
          <label key={option.id} className="flex min-h-11 items-center gap-3 border-b border-line px-3 last:border-b-0">
            <input type="checkbox" name={name} value={option.id} className="size-5 accent-brand" />
            <span>{option.title}</span>
          </label>
        ))}
        {options.length === 0 && <p className="p-3 text-sm text-muted">Chưa có dữ liệu.</p>}
      </div>
    </fieldset>
  )
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
          <span className="font-bold">Hình thức quay</span>
          <select name="style" defaultValue="reel" className={INPUT_CLASS}>
            {DRAW_STYLES.map((style) => (
              <option key={style} value={style}>
                {DRAW_STYLE_CONFIG[style].label} ({DRAW_STYLE_CONFIG[style].durationMs / 1000} giây mỗi giải)
              </option>
            ))}
          </select>
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
        <SourcePicker legend="Challenge (khi chọn nguồn challenge, chọn được nhiều)" name="challenge_id" options={challenges} />
        <SourcePicker legend="Event (khi chọn nguồn event, chọn được nhiều)" name="event_id" options={events} />
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
