import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    // Đổi theo mỗi lần deploy để service worker nhận ra bản mới
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now()),
  },
}

export default nextConfig
