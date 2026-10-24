import Link from 'next/link'
import { notFound } from 'next/navigation'
import DrawVerify from '@/components/DrawVerify'
import { requireActiveMember } from '@/lib/auth/currentMember'
import { loadDrawDetail } from '@/lib/draw/loadDraw'

export default async function DrawVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveMember()
  const { id } = await params
  const draw = await loadDrawDetail(id)
  if (!draw || draw.status === 'draft') notFound()
  const verifiable = draw.status === 'done' && draw.seedCommit && draw.seedReveal

  return (
    <section>
      <Link href={`/draws/${id}`} className="flex min-h-11 items-center font-bold text-brand-dark">
        ← {draw.title}
      </Link>
      <h1 className="text-2xl font-black">Tự kiểm tra kết quả</h1>
      <p className="mt-1 text-sm text-muted">
        Danh sách tham gia và mã commit được chốt trước khi quay. Sau khi quay xong, mã bí mật được công bố để bất kỳ ai
        cũng chạy lại được phép quay.
      </p>
      {verifiable && draw.seedCommit && draw.seedReveal ? (
        <DrawVerify
          seedCommit={draw.seedCommit}
          seedReveal={draw.seedReveal}
          participants={draw.participants}
          prizes={draw.prizes.map((prize) => ({ ...prize }))}
          results={draw.results}
        />
      ) : (
        <p className="mt-4 text-muted">Chỉ kiểm tra được sau khi đợt quay số kết thúc.</p>
      )}
    </section>
  )
}
