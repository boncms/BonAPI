'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import Image from 'next/image'
import { Video } from '@/types'
import VideoCardPremium from './VideoCardPremium'
import VideoCardTheme1 from './VideoCardTheme1'
import VideoCardTheme2 from './VideoCardTheme2'
import VideoCardTheme3 from './VideoCardTheme3'
import VideoCardTheme4 from './VideoCardTheme4'
import VideoCardTheme5 from './VideoCardTheme5'

interface CustomSectionData {
  id: number
  name: string
  category: string
  model: string
  display_count: number
  theme_card: string
  is_active: boolean
  sort_order: number
  icon?: string
  badge_text?: string
}

interface CustomSectionProps {
  section: CustomSectionData
}

const themeComponents = {
  premium: VideoCardPremium,
  theme1: VideoCardTheme1,
  theme2: VideoCardTheme2,
  theme3: VideoCardTheme3,
  theme4: VideoCardTheme4,
  theme5: VideoCardTheme5
}

export default function CustomSection({ section }: CustomSectionProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()
  

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('limit', section.display_count.toString())
      params.append('offset', '0')
      
      if (section.category) {
        params.append('category', section.category)
      }
      
      if (section.model) {
        params.append('model', section.model)
      }
      
      const response = await fetch(`/api/videos?${params.toString()}`)
      const data = await response.json()
      
      if (data.success && data.videos) {
        setVideos(data.videos)
      } else {
        setVideos([])
      }
    } catch (error) {
      console.error('Error loading videos for section:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [section])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])


  // Button color is driven by CSS variables set from settings (DynamicTheme/SSR)

  const VideoCardComponent = themeComponents[section.theme_card as keyof typeof themeComponents] || VideoCardPremium

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            {section.name}
          </h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </section>
    )
  }

  if (videos.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          {section.icon && (
            <Image src={section.icon} alt="icon" width={32} height={32} className="w-8 h-8" />
          )}
          {section.name}
        </h2>
        <button 
          className={"text-white px-3 py-1.5 rounded text-xs font-medium transition-colors bg-primary-600 hover:bg-primary-700"}
          onClick={() => {
            // Navigate to category page or search page
            if (section.category) {
              window.location.href = `/category/${section.category.toLowerCase().replace(/\s+/g, '-')}`
            } else {
              window.location.href = '/videos'
            }
          }}
        >
          View More
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCardComponent key={video.id} video={video} badgeText={section.badge_text} />
        ))}
      </div>
    </section>
  )
}
