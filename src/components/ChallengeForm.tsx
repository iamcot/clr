'use client'

import { useActionState, useEffect } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import { useToast } from '@/components/ToastProvider'
import {
  GOAL_TYPE_LABELS,
  GOAL_TYPES,
  GOAL_UNIT_LABELS,
  MAX_CATEGORIES_IN_FORM,
  PARTICIPATION_LABELS,
  PARTICIPATION_MODES,
  RANKING_LABELS,
  RANKING_MODES,
} from '@/config/challenges'
import { saveChallenge, type ChallengeFormState } from '@/lib/challenges/adminActions'

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'
const EMPTY_STATE: ChallengeFormState = { errors: {}, values: {} }

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="ml-1 text-xs text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl bg-white shadow-sm p-4">
      <legend className="px-1 text-lg font-black">{title}</legend>
      {children}
    </fieldset>
  )
}

export default function ChallengeForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveChallenge, EMPTY_STATE)
  const toast = useToast()
  useBusyIndicator(pending)
  const value = (name: string) => state.values[name] ?? defaults[name] ?? ''
  const error = (name: string) => state.errors[name]
  const goalType = (value('goal_type') || 'total_distance') as (typeof GOAL_TYPES)[number]

  useEffect(() => {
    if (state.errors.form) toast({ kind: 'error', text: state.errors.form })
    else if (Object.keys(state.errors).length > 0)
      toast({
        kind: 'error',
        text: 'Vui lòng kiểm tra lại các trường báo lỗi',
      })
  }, [state, toast])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={value('id')} />
      <Section title="1. Thông tin">
        <Field label="Tên challenge" error={error('title')}>
          <input name="title" defaultValue={value('title')} required className={INPUT_CLASS} />
        </Field>
        <Field label="Mô tả">
          <textarea name="description" defaultValue={value('description')} rows={3} className={`${INPUT_CLASS} py-2`} />
        </Field>
        <Field label="Link ảnh bìa" hint="(không bắt buộc)">
          <input name="cover_url" defaultValue={value('cover_url')} inputMode="url" className={INPUT_CLASS} />
        </Field>
        <Field label="Bắt đầu (giờ VN)" error={error('starts_at')}>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={value('starts_at')}
            required
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Kết thúc (giờ VN)" error={error('ends_at')}>
          <input
            name="ends_at"
            type="datetime-local"
            defaultValue={value('ends_at')}
            required
            className={INPUT_CLASS}
          />
        </Field>
      </Section>

      <Section title="2. Mục tiêu và hạng mục">
        <Field label="Loại mục tiêu">
          <select name="goal_type" defaultValue={value('goal_type')} className={INPUT_CLASS}>
            {GOAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {GOAL_TYPE_LABELS[type]} ({GOAL_UNIT_LABELS[type]})
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-muted">
          Mục tiêu nhập theo đơn vị của loại đã chọn ({GOAL_UNIT_LABELS[goalType]}). Để trống tên là bỏ hạng mục. Giới
          tính hoặc loại thành viên để trống nghĩa là áp dụng cho mọi người.
        </p>
        {Array.from({ length: MAX_CATEGORIES_IN_FORM }, (_, index) => (
          <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border border-line p-2">
            <input type="hidden" name={`cat_${index}_id`} value={value(`cat_${index}_id`)} />
            <input
              name={`cat_${index}_name`}
              placeholder="Tên hạng mục"
              defaultValue={value(`cat_${index}_name`)}
              className={INPUT_CLASS}
            />
            <input
              name={`cat_${index}_goal`}
              placeholder="Mục tiêu"
              inputMode="decimal"
              defaultValue={value(`cat_${index}_goal`)}
              className={INPUT_CLASS}
            />
            <select name={`cat_${index}_gender`} defaultValue={value(`cat_${index}_gender`)} className={INPUT_CLASS}>
              <option value="">Mọi giới tính</option>
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
              <option value="X">Khác</option>
            </select>
            <select name={`cat_${index}_type`} defaultValue={value(`cat_${index}_type`)} className={INPUT_CLASS}>
              <option value="">Mọi loại thành viên</option>
              <option value="official">Chính thức</option>
              <option value="free">Tự do</option>
            </select>
            {(error(`cat_${index}_goal`) || error(`cat_${index}_name`)) && (
              <span className="col-span-2 text-sm text-danger">
                {error(`cat_${index}_goal`) ?? error(`cat_${index}_name`)}
              </span>
            )}
          </div>
        ))}
      </Section>

      <Section title="3. Điều kiện mỗi buổi chạy">
        <Field label="Quãng đường tối thiểu mỗi buổi (km)">
          <input
            name="min_distance_km"
            defaultValue={value('min_distance_km')}
            inputMode="decimal"
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Pace chậm nhất được tính (m:ss/km)" hint="chậm hơn thì không tính" error={error('max_pace')}>
          <input name="max_pace" defaultValue={value('max_pace')} placeholder="9:00" className={INPUT_CLASS} />
        </Field>
        <Field label="Pace nhanh nhất được tính (m:ss/km)" hint="nhanh hơn thì nghi ngờ" error={error('min_pace')}>
          <input name="min_pace" defaultValue={value('min_pace')} placeholder="3:00" className={INPUT_CLASS} />
        </Field>
        <Field label="Tối đa mỗi ngày (km)" hint="chặn dồn chỉ tiêu">
          <input
            name="max_km_per_day"
            defaultValue={value('max_km_per_day')}
            inputMode="decimal"
            className={INPUT_CLASS}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Chỉ tính từ giờ" error={error('window_start')}>
            <input
              name="window_start"
              defaultValue={value('window_start')}
              inputMode="numeric"
              placeholder="4"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Đến giờ">
            <input
              name="window_end"
              defaultValue={value('window_end')}
              inputMode="numeric"
              placeholder="9"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section title="4. Tham gia">
        <Field label="Cách tham gia">
          <select name="participation" defaultValue={value('participation')} className={INPUT_CLASS}>
            {PARTICIPATION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PARTICIPATION_LABELS[mode]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hạn đăng ký (giờ VN)" hint="trống = tới khi kết thúc" error={error('registration_closes_at')}>
          <input
            name="registration_closes_at"
            type="datetime-local"
            defaultValue={value('registration_closes_at')}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Xếp hạng">
          <select name="ranking" defaultValue={value('ranking')} className={INPUT_CLASS}>
            {RANKING_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {RANKING_LABELS[mode]}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="5. Thưởng và phạt">
        <Field label="Phạt khi không đạt (đồng)">
          <input name="fail_amount" defaultValue={value('fail_amount')} inputMode="numeric" className={INPUT_CLASS} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Phạt khi đạt dưới ngưỡng (đồng)">
            <input name="low_amount" defaultValue={value('low_amount')} inputMode="numeric" className={INPUT_CLASS} />
          </Field>
          <Field label="Ngưỡng (% mục tiêu)">
            <input
              name="low_threshold_pct"
              defaultValue={value('low_threshold_pct')}
              inputMode="numeric"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="exempt_free" defaultChecked={value('exempt_free') === 'on'} className="size-5" />
          <span>Thành viên tự do không bị phạt</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Thưởng top mỗi hạng mục">
            <input
              name="reward_top_n"
              defaultValue={value('reward_top_n')}
              inputMode="numeric"
              placeholder="3"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Số tiền thưởng (đồng)" hint="trống = hiện vật">
            <input
              name="reward_amount"
              defaultValue={value('reward_amount')}
              inputMode="numeric"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <Field label="Tên phần thưởng">
          <input name="reward_title" defaultValue={value('reward_title')} placeholder="Top 3" className={INPUT_CLASS} />
        </Field>
      </Section>

      {state.errors.form && (
        <p role="alert" className="text-sm text-danger">
          {state.errors.form}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark disabled:opacity-60"
      >
        Lưu challenge
      </button>
    </form>
  )
}
