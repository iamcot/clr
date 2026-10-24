'use client'

import { useActionState, useEffect } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import { useToast } from '@/components/ToastProvider'
import { GENDER_OPTIONS } from '@/config/profile'
import { saveProfile, skipProfile } from '@/lib/members/profileActions'
import { EMPTY_PROFILE_FORM_STATE } from '@/lib/members/profileFormState'

export type ProfileFormDefaults = {
  display_name: string
  gender: string
  birth_year: string
  phone: string
}

type ProfileFormProps = {
  defaults: ProfileFormDefaults
  redirectTo: '/' | '/me'
  canSkip?: boolean
}

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-line bg-white px-3'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

export default function ProfileForm({ defaults, redirectTo, canSkip = false }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfile, EMPTY_PROFILE_FORM_STATE)
  const toast = useToast()
  useBusyIndicator(pending)
  const value = (field: keyof ProfileFormDefaults) => state.values[field] ?? defaults[field]

  useEffect(() => {
    if (state.errors.form) toast({ kind: 'error', text: state.errors.form })
    else if (Object.keys(state.errors).length > 0) toast({ kind: 'error', text: 'Vui lòng kiểm tra lại các trường báo lỗi' })
  }, [state, toast])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={redirectTo} />
      <Field label="Tên hiển thị" error={state.errors.display_name}>
        <input name="display_name" defaultValue={value('display_name')} maxLength={50} required className={INPUT_CLASS} />
      </Field>
      <Field label="Giới tính" error={state.errors.gender}>
        <select name="gender" defaultValue={value('gender')} className={INPUT_CLASS}>
          <option value="">Chưa chọn</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Năm sinh" error={state.errors.birth_year}>
        <input name="birth_year" defaultValue={value('birth_year')} inputMode="numeric" className={INPUT_CLASS} />
      </Field>
      <Field label="Số điện thoại (không bắt buộc)" error={state.errors.phone}>
        <input name="phone" defaultValue={value('phone')} inputMode="tel" className={INPUT_CLASS} />
      </Field>
      {state.errors.form && <p role="alert" className="text-sm text-danger">{state.errors.form}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark disabled:opacity-60"
      >
        Lưu
      </button>
      {canSkip && (
        <button formAction={skipProfile} formNoValidate className="min-h-11 text-sm text-muted underline">
          Để sau
        </button>
      )}
    </form>
  )
}
