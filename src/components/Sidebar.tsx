'use client'

import Image from 'next/image'
import { Eye, Play } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { Video } from '@/types'
import AdBanner from '@/components/AdBanner'
import { useState } from 'react'

interface SidebarProps {
  relatedVideos?: Video[]
  featuredVideos?: Video[]
  mostViewedVideos?: Video[]
  randomVideos?: Video[]
  showFeatured?: boolean
  showMostViewed?: boolean
  showRandom?: boolean
  showRelated?: boolean
}

export default function Sidebar({
  relatedVideos = [],
  featuredVideos = [],
  mostViewedVideos = [],
  randomVideos = [],
  showFeatured = false,
  showMostViewed = false,
  showRandom = false,
  showRelated = false,
}: SidebarProps) {
  const toSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
  const navTo = (video: Video) => {
    const slug = video.slug && video.slug.length > 0 ? video.slug : toSlug(video.title)
    window.location.href = `/video/${slug}`
  }
  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="space-y-6">
        {showFeatured && featuredVideos.length > 0 && (
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Image src="/icons/featured_sidebar.png" alt="Featured Video" width={32} height={32} className="w-8 h-8" />
              Featured Video
            </h3>
            <div className="space-y-4">
              {featuredVideos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex gap-3 cursor-pointer hover:bg-dark-700 p-2 rounded" onClick={() => navTo(video)}>
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 bg-dark-700">
                    <Image
                      src={video.thumbnail || '/no-thumbnail.webp'}
                      alt={video.title}
                      width={160}
                      height={112}
                      sizes="80px"
                      className="w-full h-full object-cover"
                      quality={95}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                    <div className="text-xs text-dark-400 flex items-center gap-1">
                      <span>UHQ</span> • 
                      <Eye className="w-3 h-3 text-primary-500" />
                      <span>{formatNumber(video.views)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar Ad Slot 1 */}
        <AdBanner position="sidebar_1" fallbackTitle="Sidebar Ad 300x250" />

        {showMostViewed && mostViewedVideos.length > 0 && (
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Image src="/icons/most.png" alt="Most Viewed" width={32} height={32} className="w-8 h-8" />
              Most Viewed
            </h3>
            <div className="space-y-4">
              {mostViewedVideos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex gap-3 cursor-pointer hover:bg-dark-700 p-2 rounded" onClick={() => navTo(video)}>
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 bg-dark-700">
                    <Image
                      src={video.thumbnail || '/no-thumbnail.webp'}
                      alt={video.title}
                      width={160}
                      height={112}
                      sizes="80px"
                      className="w-full h-full object-cover"
                      quality={95}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                    <div className="text-xs text-dark-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-primary-500" />
                      <span>{formatNumber(video.views)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar Ad Slot 2 */}
        <AdBanner position="sidebar_2" fallbackTitle="Sidebar Ad 300x250" />

        {showRandom && randomVideos.length > 0 && (
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Image src="/icons/random.png" alt="Random Videos" width={32} height={32} className="w-8 h-8" />
              Random Videos
            </h3>
            <div className="space-y-4">
              {randomVideos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex gap-3 cursor-pointer hover:bg-dark-700 p-2 rounded" onClick={() => navTo(video)}>
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 bg-dark-700">
                    <Image
                      src={video.thumbnail || '/no-thumbnail.webp'}
                      alt={video.title}
                      width={80}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                    <div className="text-xs text-dark-400 flex items-center gap-1">
                      <span>UHQ</span> • 
                      <Eye className="w-3 h-3 text-primary-500" />
                      <span>{formatNumber(video.views)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar Ad Slot 3 */}
        <AdBanner position="sidebar_3" fallbackTitle="Sidebar Ad 300x250" />

        {showRelated && relatedVideos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Related Videos</h3>
            <div className="space-y-4">
              {relatedVideos.map((relatedVideo) => (
                <div
                  key={relatedVideo.id}
                  className="flex gap-3 p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors cursor-pointer group"
                  onClick={() => navTo(relatedVideo)}
                >
                  {/* Thumbnail */}
                  <div className="relative w-32 h-20 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={relatedVideo.thumbnail || '/no-thumbnail.webp'}
                      alt={relatedVideo.title}
                      width={256}
                      height={160}
                      sizes="128px"
                      quality={95}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                      {relatedVideo.duration}
                    </div>
                  </div>
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                      {relatedVideo.title}
                    </h4>
                    <p className="text-xs text-dark-300 mt-1 line-clamp-1">{relatedVideo.model}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                      <Eye className="w-3 h-3 text-primary-500" />
                      <span>{formatNumber(relatedVideo.views)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}


