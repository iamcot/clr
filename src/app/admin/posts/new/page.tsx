import BackLink from '@/components/BackLink'
import PostForm from '@/components/PostForm'

export default function NewPostPage() {
  return (
    <section>
      <BackLink href="/admin/posts">Bài viết</BackLink>
      <h1 className="mt-2 mb-4 text-2xl font-black">Soạn bài mới</h1>
      <PostForm defaults={{ publish_mode: 'now', kind: 'announcement' }} />
    </section>
  )
}
