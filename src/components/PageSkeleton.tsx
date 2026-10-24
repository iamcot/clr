const ROW_COUNT = 4

export function ListSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="h-7 w-1/3 rounded bg-line" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <div key={index} className="h-20 rounded-lg bg-line/60" />
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Đang tải">
      <div className="h-5 w-1/4 rounded bg-line" />
      <div className="mt-3 h-8 w-2/3 rounded bg-line" />
      <div className="mt-4 h-36 rounded-xl bg-line/60" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-14 rounded-lg bg-line/60" />
        ))}
      </div>
    </div>
  )
}

export default ListSkeleton
