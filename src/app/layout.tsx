import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-be-vietnam-pro',
})

export const metadata: Metadata = {
  title: 'CLR',
  description: 'Ứng dụng của CLB chạy bộ CLR',
}

export const viewport: Viewport = {
  themeColor: '#1e3a1a',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
