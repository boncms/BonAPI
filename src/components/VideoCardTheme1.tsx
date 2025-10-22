'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Video } from '@/types'
import { formatNumber, createSlug } from '@/lib/utils'
import { Play, Eye, Heart } from 'lucide-react'

interface VideoCardTheme1Props {
  video: Video
  // Optional custom badge text from custom sections
  badgeText?: string
}

export default function VideoCardTheme1({ video, badgeText }: VideoCardTheme1Props) {
  const hrefSlug = (video.slug && video.slug.length > 0) ? video.slug : createSlug(video.title)
  return (
    <Link href={`/video/${hrefSlug}`} className="group block h-full">
      <div className="relative bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl overflow-hidden border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 h-full flex flex-col">
        {/* Premium / Custom Badge */}
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current" />
            {badgeText || 'PREMIUM'}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={video.thumbnail || '/no-thumbnail.webp'}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            quality={90}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-white/30">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>

          {/* Duration */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
              {video.duration}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-blue-300 transition-colors h-10 flex items-start overflow-hidden">
            <span className="line-clamp-2 leading-tight">
              {video.title}
            </span>
          </h3>
          
          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(video.views)}</span>
            </div>
            
            {video.likes > 0 && (
              <div className="flex items-center gap-1 text-blue-400">
                <Heart className="w-3 h-3 fill-current" />
                <span>{formatNumber(video.likes)}</span>
              </div>
            )}
          </div>

          {/* Theme Glow Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </div>
    </Link>
  )
}
