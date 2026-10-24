import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DbCheckPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('settings').select('key, value').limit(1)

  return (
    <main className="mx-auto max-w-[480px] p-4">
      <h1 className="text-2xl font-black">Kiểm tra Supabase</h1>
      <pre className="mt-4 overflow-auto rounded-lg bg-white shadow-sm p-3 text-xs">
        {JSON.stringify(error ?? data, null, 2)}
      </pre>
    </main>
  )
}
