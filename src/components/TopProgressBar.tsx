export default function TopProgressBar() {
  return (
    <div role="progressbar" aria-label="Đang xử lý" className="fixed inset-x-0 top-0 z-[60] h-1 bg-lime/30">
      <div className="nav-progress-bar h-full bg-lime" />
    </div>
  )
}
