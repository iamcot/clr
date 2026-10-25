import ActionForm from '@/components/ActionForm'
import DateInput from '@/components/admin/DateInput'
import AdminFormSection from '@/components/admin/AdminFormSection'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTabs from '@/components/admin/AdminTabs'
import Badge from '@/components/admin/Badge'
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable'
import FormField from '@/components/admin/FormField'
import Pagination from '@/components/admin/Pagination'
import { ADMIN_INPUT_CLASS, adminButtonClass } from '@/components/admin/styles'
import ImageField from '@/components/ImageField'
import { HONOR_KIND_ICONS, HONOR_KIND_LABELS } from '@/config/hallOfFame'
import { hrefWithPage, parsePage, slicePage } from '@/lib/admin/pagination'
import { pickTab } from '@/lib/admin/tabs'
import { requireBcn } from '@/lib/auth/requireBcn'
import { formatDateVi } from '@/lib/format/dateTime'
import { addSpecialHonor, announceRecords, deleteHonor, generateHonors, setHonorApproved } from '@/lib/hallOfFame/adminActions'
import { loadHonors, type HonorView } from '@/lib/hallOfFame/loadHonors'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const TABS = ['pending', 'approved', 'add'] as const

async function loadMemberOptions() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('members_public').select('id, display_name').order('display_name')
  return data ?? []
}

const HONOR_COLUMNS: DataTableColumn<HonorView>[] = [
  {
    key: 'member',
    header: 'Thành viên',
    cell: (honor) => (
      <b>
        {HONOR_KIND_ICONS[honor.kind]} {honor.memberName}
      </b>
    ),
  },
  {
    key: 'title',
    header: 'Danh hiệu',
    cell: (honor) => (
      <span>
        {honor.title}
        {honor.detail && <span className="block text-xs text-muted">{honor.detail}</span>}
      </span>
    ),
  },
  { key: 'kind', header: 'Loại', hideBelowMd: true, cell: (honor) => <Badge tone="info">{HONOR_KIND_LABELS[honor.kind]}</Badge> },
  { key: 'date', header: 'Ngày', hideBelowMd: true, cell: (honor) => formatDateVi(`${honor.date}T00:00:00+07:00`) },
  {
    key: 'actions',
    header: '',
    align: 'right',
    cell: (honor) => (
      <span className="flex justify-end gap-2">
        <ActionForm action={setHonorApproved}>
          <input type="hidden" name="honor_id" value={honor.id} />
          <input type="hidden" name="approved" value={honor.approved ? 'false' : 'true'} />
          <button type="submit" className={adminButtonClass(honor.approved ? 'secondary' : 'primary')}>
            {honor.approved ? 'Ẩn' : 'Duyệt'}
          </button>
        </ActionForm>
        <ActionForm action={deleteHonor}>
          <input type="hidden" name="honor_id" value={honor.id} />
          <button type="submit" className={adminButtonClass('danger')}>
            Xoá
          </button>
        </ActionForm>
      </span>
    ),
  },
]

export default async function AdminHonorsPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  await requireBcn()
  const query = await searchParams
  const tab = pickTab(TABS, query.tab, 'pending')
  const honors = await loadHonors({ approvedOnly: false })
  const pending = honors.filter((honor) => !honor.approved)
  const approved = honors.filter((honor) => honor.approved)
  const members = tab === 'add' ? await loadMemberOptions() : []
  const paged = slicePage(tab === 'approved' ? approved : pending, parsePage(query.page))

  return (
    <section>
      <AdminPageHeader
        title="Bảng vàng"
        description="Duyệt danh hiệu và thêm danh hiệu đặc biệt"
        actions={
          <>
            <ActionForm action={generateHonors}>
              <button type="submit" className={adminButtonClass('secondary')}>
                Quét danh hiệu mới
              </button>
            </ActionForm>
            <ActionForm action={announceRecords}>
              <button type="submit" className={adminButtonClass('secondary')}>
                Đăng bài chúc mừng kỷ lục
              </button>
            </ActionForm>
          </>
        }
      />
      <AdminTabs
        items={[
          { href: '/admin/honors', label: `Chờ duyệt (${pending.length})`, active: tab === 'pending' },
          { href: '/admin/honors?tab=approved', label: `Đã duyệt (${approved.length})`, active: tab === 'approved' },
          { href: '/admin/honors?tab=add', label: 'Thêm đặc biệt', active: tab === 'add' },
        ]}
      />

      <div className="mt-4">
        {tab !== 'add' && (
          <>
            <DataTable
              columns={HONOR_COLUMNS}
              rows={paged.rows}
              rowKey={(honor) => honor.id}
              emptyText={tab === 'pending' ? 'Không có danh hiệu nào chờ duyệt.' : 'Chưa có danh hiệu nào được duyệt.'}
            />
            <Pagination window={paged.window} hrefFor={(page) => hrefWithPage('/admin/honors', query, page)} unit="danh hiệu" />
          </>
        )}

        {tab === 'add' && (
          <ActionForm action={addSpecialHonor}>
            <AdminFormSection columns={2} title="Thêm danh hiệu đặc biệt">
              <FormField label="Thành viên">
                <select name="member_id" required defaultValue="" className={ADMIN_INPUT_CLASS}>
                  <option value="" disabled>
                    Chọn thành viên
                  </option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id ?? ''}>
                      {member.display_name ?? 'Thành viên'}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Ngày">
                <DateInput name="honor_date" type="date" required />
              </FormField>
              <FormField label="Tên danh hiệu">
                <input name="title" required className={ADMIN_INPUT_CLASS} />
              </FormField>
              <FormField label="Mô tả ngắn" hint="(không bắt buộc)">
                <input name="detail" className={ADMIN_INPUT_CLASS} />
              </FormField>
              <FormField label="Ảnh" className="md:col-span-2">
                <ImageField name="image_url" purpose="cover" />
              </FormField>
              <div className="md:col-span-2">
                <button type="submit" className={adminButtonClass('primary')}>
                  Thêm danh hiệu
                </button>
              </div>
            </AdminFormSection>
          </ActionForm>
        )}
      </div>
    </section>
  )
}
