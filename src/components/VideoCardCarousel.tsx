'use client'

import Link from 'next/link'
import { Video } from '@/types'
import { Play, Clock } from 'lucide-react'
import Image from 'next/image'

interface VideoCardCarouselProps {
  video: Video
  onClick?: () => void
}

export default function VideoCardCarousel({ video, onClick }: VideoCardCarouselProps) {
  const slug = video.slug && video.slug.length > 0 ? video.slug : video.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()

  return (
    <Link prefetch href={`/video/${slug}`} className="relative w-full h-full cursor-pointer block" onClick={onClick}>
      {/* Thumbnail */}
      <Image
        src={video.thumbnail || '/no-thumbnail.webp'}
        alt={video.title}
        fill
        className="object-cover"
        sizes="100vw"
        quality={90}
        priority={false}
        unoptimized={false}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </Link>
  )
}
