import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { Suspense } from 'react'
import BusyProvider from '@/components/BusyProvider'
import NavigationProgress from '@/components/NavigationProgress'
import ToastProvider from '@/components/ToastProvider'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-be-vietnam-pro',
})

const SPLASH_SIZES = [
  { width: 1170, height: 2532, deviceWidth: 390, deviceHeight: 844 },
  { width: 1179, height: 2556, deviceWidth: 393, deviceHeight: 852 },
  { width: 1290, height: 2796, deviceWidth: 430, deviceHeight: 932 },
  { width: 1125, height: 2436, deviceWidth: 375, deviceHeight: 812 },
  { width: 828, height: 1792, deviceWidth: 414, deviceHeight: 896 },
  { width: 1242, height: 2688, deviceWidth: 414, deviceHeight: 896 },
]

export const metadata: Metadata = {
  title: 'CLR',
  description: 'Ứng dụng của CLB chạy bộ CLR',
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    title: 'CLR',
    statusBarStyle: 'black-translucent',
    startupImage: SPLASH_SIZES.map((size) => ({
      url: `/icons/splash-${size.width}x${size.height}.png`,
      media: `(device-width: ${size.deviceWidth}px) and (device-height: ${size.deviceHeight}px) and (-webkit-device-pixel-ratio: ${size.width / size.deviceWidth})`,
    })),
  },
}

export const viewport: Viewport = {
  themeColor: '#1e3a1a',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="antialiased">
        <Suspense>
          <NavigationProgress />
        </Suspense>
        <BusyProvider>
          <ToastProvider>{children}</ToastProvider>
        </BusyProvider>
      </body>
    </html>
  )
}
