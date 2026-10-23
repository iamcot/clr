const COLOR_TOKENS = [
  { name: 'brand', className: 'bg-brand text-white' },
  { name: 'brand-dark', className: 'bg-brand-dark text-white' },
  { name: 'deep', className: 'bg-deep text-white' },
  { name: 'lime', className: 'bg-lime text-deep' },
  { name: 'gold', className: 'bg-gold text-deep' },
  { name: 'page', className: 'bg-page text-ink border border-line' },
  { name: 'ink', className: 'bg-ink text-white' },
  { name: 'muted', className: 'bg-muted text-white' },
  { name: 'line', className: 'bg-line text-ink' },
  { name: 'danger', className: 'bg-danger text-white' },
  { name: 'success', className: 'bg-success text-white' },
]

function ColorSwatches() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {COLOR_TOKENS.map((token) => (
        <div key={token.name} className={`rounded-lg p-3 text-xs font-bold ${token.className}`}>
          {token.name}
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="rounded-xl bg-deep p-4">
      <div className="h-2 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-lime" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-white">Tiến độ {percent}%</p>
    </div>
  )
}

export default function ThemePreviewPage() {
  return (
    <main className="mx-auto max-w-[480px] space-y-6 p-4">
      <h1 className="text-2xl font-black">Bảng màu CLR</h1>
      <ColorSwatches />
      <button className="min-h-11 rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark">
        Nút chính
      </button>
      <ProgressBar percent={65} />
      <span className="inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold text-deep">Bảng vàng</span>
      <p className="text-danger">Còn nợ 100.000đ</p>
    </main>
  )
}
