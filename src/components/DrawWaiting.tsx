export default function DrawWaiting({ text }: { text: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-deep px-4 py-10 text-white">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-20 animate-pulse text-lime"
        aria-hidden
      >
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13M5 12v9h14v-9M12 8c-1-3-5-4-5-1.5S10 8 12 8c1-3 5-4 5-1.5S14 8 12 8Z" />
      </svg>
      <p className="text-lg font-bold">{text}</p>
      <p className="text-sm text-white/70">Trang sẽ tự chạy khi BCN bắt đầu</p>
    </div>
  )
}
