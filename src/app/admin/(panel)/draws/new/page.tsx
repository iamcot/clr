import ActionForm from '@/components/ActionForm'
import AdminFormSection from '@/components/admin/AdminFormSection'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import FormField from '@/components/admin/FormField'
import StickyActionBar from '@/components/admin/StickyActionBar'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import DrawPrizeFields from '@/components/DrawPrizeFields'
import DrawSourceFields from '@/components/DrawSourceFields'
import { DRAW_STYLE_CONFIG, DRAW_STYLES } from '@/config/draw'
import { requireBcn } from '@/lib/auth/requireBcn'
import { createDraw } from '@/lib/draw/adminActions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const INPUT_CLASS = ADMIN_INPUT_CLASS
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
      <AdminPageHeader title="Tạo đợt quay số" backHref="/admin/draws" backLabel="Quay số" />
      <ActionForm action={createDraw} className="flex flex-col gap-4">
        <AdminFormSection title="Thông tin chung">
          <FormField label="Tên đợt quay số">
            <input name="title" required className={INPUT_CLASS} />
          </FormField>
          <FormField label="Hình thức quay">
            <select name="style" defaultValue="reel" className={INPUT_CLASS}>
              {DRAW_STYLES.map((style) => (
                <option key={style} value={style}>
                  {DRAW_STYLE_CONFIG[style].label} ({DRAW_STYLE_CONFIG[style].durationMs / 1000} giây mỗi giải)
                </option>
              ))}
            </select>
          </FormField>
        </AdminFormSection>
        <AdminFormSection title="Nguồn danh sách">
          <DrawSourceFields challenges={challenges} events={events} />
        </AdminFormSection>
        <AdminFormSection title="Giải thưởng">
          <DrawPrizeFields />
        </AdminFormSection>
        <StickyActionBar>
          <button type="submit" className={adminButtonClass('primary')}>
            Tạo và chọn danh sách
          </button>
        </StickyActionBar>
      </ActionForm>
    </section>
  )
}
