'use client'

import { useEffect } from 'react'
import { markPostRead } from '@/lib/posts/memberActions'

export default function MarkPostRead({ postId }: { postId: string }) {
  useEffect(() => {
    void markPostRead(postId)
  }, [postId])
  return null
}
