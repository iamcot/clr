export default function StickyActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-hairline bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  )
}
