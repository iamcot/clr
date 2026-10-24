import Image from 'next/image'

export default function AppHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-white px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-deep">
      <Image src="/brand/clr-logo.jpg" alt="Logo CLR" width={40} height={40} className="rounded-full" />
      <div className="leading-tight">
        <p className="text-lg font-black tracking-wide">CLR</p>
        <p className="text-xs text-muted">Celadon Running Club</p>
      </div>
    </header>
  )
}
