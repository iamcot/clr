import ActionForm from '@/components/ActionForm'
import ImageField from '@/components/ImageField'
import { HONOR_KIND_ICONS, HONOR_KIND_LABELS } from '@/config/hallOfFame'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatDateVi } from '@/lib/format/dateTime'
import { addSpecialHonor, announceRecords, deleteHonor, generateHonors, setHonorApproved } from '@/lib/hallOfFame/adminActions'
import { loadHonors, type HonorView } from '@/lib/hallOfFame/loadHonors'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const INPUT_CLASS = 'min-h-10 w-full rounded-md border border-line bg-white px-2.5 text-sm md:min-h-8'
const BUTTON_CLASS = 'min-h-11 rounded-md border border-line bg-white px-4 font-bold'

async function loadMemberOptions() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members_public').select('id, display_name').order('display_name')
  return data ?? []
}

function HonorRow({ honor }: { honor: HonorView }) {
  return (
    <li className="rounded-md bg-white p-3">
      <p className="font-bold">
        {HONOR_KIND_ICONS[honor.kind]} {honor.memberName}
      </p>
      <p className="text-sm">{honor.title}</p>
      <p className="text-xs text-muted">
        {HONOR_KIND_LABELS[honor.kind]} · {honor.detail && `${honor.detail} · `}
        {formatDateVi(`${honor.date}T00:00:00+07:00`)}
      </p>
      <div className="mt-2 flex gap-2">
        <ActionForm action={setHonorApproved}>
          <input type="hidden" name="honor_id" value={honor.id} />
          <input type="hidden" name="approved" value={honor.approved ? 'false' : 'true'} />
          <button type="submit" className={BUTTON_CLASS}>
            {honor.approved ? 'Ẩn' : 'Duyệt'}
          </button>
        </ActionForm>
        <ActionForm action={deleteHonor}>
          <input type="hidden" name="honor_id" value={honor.id} />
          <button type="submit" className={`${BUTTON_CLASS} text-danger`}>
            Xoá
          </button>
        </ActionForm>
      </div>
    </li>
  )
}

export default async function AdminHonorsPage() {
  await requireBcn()
  const [honors, members] = await Promise.all([loadHonors({ approvedOnly: false }), loadMemberOptions()])
  const pending = honors.filter((honor) => !honor.approved)
  const approved = honors.filter((honor) => honor.approved)

  return (
    <section>
      <h1 className="text-2xl font-black">Bảng vàng</h1>
      <ActionForm action={generateHonors} className="mt-3">
        <button type="submit" className={`${BUTTON_CLASS} w-full`}>
          Quét danh hiệu mới từ dữ liệu
        </button>
      </ActionForm>

      <ActionForm action={announceRecords} className="mt-2">
        <button type="submit" className={`${BUTTON_CLASS} w-full`}>
          Đăng bài chúc mừng các kỷ lục hiện tại
        </button>
      </ActionForm>

      <h2 className="mt-6 text-lg font-black">Chờ duyệt ({pending.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {pending.map((honor) => (
          <HonorRow key={honor.id} honor={honor} />
        ))}
      </ul>
      {pending.length === 0 && <p className="mt-2 text-muted">Không có danh hiệu nào chờ duyệt.</p>}

      <h2 className="mt-6 text-lg font-black">Thêm danh hiệu đặc biệt</h2>
      <ActionForm action={addSpecialHonor} className="mt-2 flex flex-col gap-3">
        <select name="member_id" required defaultValue="" className={INPUT_CLASS}>
          <option value="" disabled>
            Chọn thành viên
          </option>
          {members.map((member) => (
            <option key={member.id} value={member.id ?? ''}>
              {member.display_name ?? 'Thành viên'}
            </option>
          ))}
        </select>
        <input name="title" required placeholder="Tên danh hiệu" className={INPUT_CLASS} />
        <input name="detail" placeholder="Mô tả ngắn (không bắt buộc)" className={INPUT_CLASS} />
        <input name="honor_date" type="date" required className={INPUT_CLASS} />
        <ImageField name="image_url" purpose="cover" />
        <button type="submit" className="min-h-12 rounded-full bg-brand font-bold text-white">
          Thêm danh hiệu
        </button>
      </ActionForm>

      <h2 className="mt-6 text-lg font-black">Đã duyệt ({approved.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {approved.map((honor) => (
          <HonorRow key={honor.id} honor={honor} />
        ))}
      </ul>
    </section>
  )
}
