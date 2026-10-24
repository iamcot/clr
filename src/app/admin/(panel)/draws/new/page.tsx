import ActionForm from '@/components/ActionForm'
import DrawPrizeFields from '@/components/DrawPrizeFields'
import DrawSourceFields from '@/components/DrawSourceFields'
import { DRAW_STYLE_CONFIG, DRAW_STYLES } from '@/config/draw'
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
          <span className="font-bold">Hình thức quay</span>
          <select name="style" defaultValue="reel" className={INPUT_CLASS}>
            {DRAW_STYLES.map((style) => (
              <option key={style} value={style}>
                {DRAW_STYLE_CONFIG[style].label} ({DRAW_STYLE_CONFIG[style].durationMs / 1000} giây mỗi giải)
              </option>
            ))}
          </select>
        </label>
        <DrawSourceFields challenges={challenges} events={events} />
        <DrawPrizeFields />
        <button type="submit" className="min-h-12 rounded-full bg-brand font-bold text-white">
          Tạo và chọn danh sách
        </button>
      </ActionForm>
    </section>
  )
}
