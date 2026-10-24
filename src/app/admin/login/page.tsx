import Image from 'next/image'
import { redirect } from 'next/navigation'
import AdminLoginForm from '@/components/AdminLoginForm'
import { safeNextPath } from '@/lib/auth/nextPath'
import { getBcnMember } from '@/lib/auth/requireBcn'

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getBcnMember()) redirect('/admin')
  const { next } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-6 text-center">
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={80} height={80} className="rounded-full" priority />
      <div>
        <h1 className="text-2xl font-black">Quản trị CLR</h1>
        <p className="mt-1 text-sm text-muted">Dành cho Ban chủ nhiệm</p>
      </div>
      <AdminLoginForm next={safeNextPath(next)} />
    </main>
  )
}
