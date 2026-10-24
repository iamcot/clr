const ROW_COUNT = 4

export default function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="h-7 w-1/3 rounded bg-line" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <div key={index} className="h-16 rounded-lg bg-white" />
        ))}
      </div>
    </div>
  )
}
