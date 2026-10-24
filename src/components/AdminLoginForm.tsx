'use client'

import { useActionState } from 'react'
import { signInAdmin, type AdminSignInState } from '@/lib/auth/adminSignIn'

const INPUT_CLASS = 'min-h-12 w-full rounded-lg border border-line bg-white px-3'

export default function AdminLoginForm({ next }: { next: string | null }) {
  const [state, formAction, pending] = useActionState<AdminSignInState, FormData>(signInAdmin, null)

  return (
    <form action={formAction} className="flex w-full flex-col gap-3 text-left">
      {next && <input type="hidden" name="next" value={next} />}
      {state && (
        <p role="alert" className="rounded-lg border border-danger px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="text-sm font-bold">Tên đăng nhập</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className={`${INPUT_CLASS} mt-1`}
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold">Mật khẩu</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`${INPUT_CLASS} mt-1`}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-brand font-bold text-white active:bg-brand-dark disabled:opacity-60"
      >
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  )
}
