import AdminPageHeader from '@/components/admin/AdminPageHeader'
import PostForm from '@/components/PostForm'

export default function NewPostPage() {
  return (
    <section>
      <AdminPageHeader title="Soạn bài mới" backHref="/admin/posts" backLabel="Bài viết" />
      <PostForm defaults={{ publish_mode: 'now', kind: 'announcement' }} />
    </section>
  )
}
