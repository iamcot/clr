import Link from 'next/link'
import PostForm from '@/components/PostForm'

export default function NewPostPage() {
  return (
    <section>
      <Link href="/admin/posts" className="text-sm text-muted underline">
        ← Bài viết
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-black">Soạn bài mới</h1>
      <PostForm defaults={{ publish_mode: 'now', kind: 'announcement' }} />
    </section>
  )
}
