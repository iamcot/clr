import Link from 'next/link'

export default function MePage() {
  return (
    <section>
      <h1 className="text-2xl font-black">Tôi</h1>
      <p className="mt-2 text-muted">Hồ sơ cá nhân đang được xây dựng.</p>
      <Link href="/me/settings" className="mt-6 flex min-h-11 items-center font-bold text-brand-dark underline">
        Cài đặt hồ sơ
      </Link>
      <form action="/api/auth/logout" method="post" className="mt-2">
        <button type="submit" className="min-h-11 rounded-lg border border-line px-4 font-bold">
          Đăng xuất
        </button>
      </form>
    </section>
  )
}
