'use client'

import { useActionState, useEffect } from 'react'
import { useBusyIndicator } from '@/components/BusyProvider'
import { useToast } from '@/components/ToastProvider'
import type { ActionResult } from '@/lib/toast/actionResult'

type ActionFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>
  children: React.ReactNode
  className?: string
}

export default function ActionForm({ action, children, className }: ActionFormProps) {
  const toast = useToast()
  const [result, formAction, pending] = useActionState(async (_previous: ActionResult | null, formData: FormData) => {
    return (await action(formData)) ?? null
  }, null)

  useBusyIndicator(pending)

  useEffect(() => {
    if (result) toast(result)
  }, [result, toast])

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  )
}
