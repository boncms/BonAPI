'use client'

import Link from 'next/link'
import { memo } from 'react'
import Image from 'next/image'
import { Video } from '@/types'
import { getTimeAgo, createSlug, formatNumber } from '@/lib/utils'
// import { Eye } from 'lucide-react'

interface VideoCardProps {
  video: Video
  onClick?: () => void
  priority?: boolean
}

function VideoCard({ video, onClick, priority = false }: VideoCardProps) {
  const uploadDate = new Date(video.uploadDate)
  const timeAgo = getTimeAgo(uploadDate)

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div className="card">
      <Link
        prefetch
        onMouseEnter={() => { /* hint for router to prefetch */ }}
        href={`/video/${video.slug || createSlug(video.title)}`}
        className="block cursor-pointer hover:transform hover:scale-105 transition-all duration-300 overflow-hidden"
        onClick={handleClick}
      >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-dark-700 flex items-center justify-center overflow-hidden">
        {video.thumbnail ? (
          <Image 
            src={video.thumbnail} 
            alt={video.title}
            fill
            className="object-cover"
            quality={90}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
              if (nextElement) {
                nextElement.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-dark-700 flex items-center justify-center" style={{ display: video.thumbnail ? 'none' : 'flex' }}>
          <div className="text-dark-400 text-sm">Thumbnail</div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-3 flex flex-col h-20">
        <h3 className="text-white text-xs font-medium line-clamp-2 mb-2 flex-1">
          {video.title}
        </h3>
        <div className="flex justify-between items-center text-xs text-dark-400">
          <span>{timeAgo}</span>
          <div className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--primary-500, #3b82f6)' }}
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>{formatNumber(video.views)}</span>
          </div>
        </div>
      </div>
      </Link>
    </div>
  )
}

export default memo(VideoCard)
