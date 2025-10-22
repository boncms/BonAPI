'use client'

import { useState, useEffect, useRef } from 'react'
import { Video } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import dbService from '@/lib/database-client'

interface VideoCarouselProps {
  videos: Video[]
}

export default function VideoCarousel({ videos }: VideoCarouselProps) {
  const { settings } = useSettings()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [randomVideos, setRandomVideos] = useState<Video[]>([])
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [imageKey, setImageKey] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load all videos for trending section
  useEffect(() => {
    const loadAllVideos = async () => {
      try {
        const allVids = await dbService.getVideos()
        setAllVideos(allVids)
      } catch (error) {
        console.error('Error loading videos for trending:', error)
      }
    }
    
    loadAllVideos()
  }, [])

  // Use incoming videos for main carousel; if empty, keep empty
  useEffect(() => {
    if (videos && videos.length > 0) {
      const shuffled = [...videos].sort(() => 0.5 - Math.random())
      setRandomVideos(shuffled.slice(0, Math.min(12, shuffled.length)))
    } else {
      setRandomVideos([])
    }
  }, [videos])

  // Auto-play functionality
  useEffect(() => {
    if (randomVideos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % randomVideos.length)
      }, 8000) // Change slide every 8 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [randomVideos.length])

  const showSlide = (index: number) => {
    if (isTransitioning) return
    if (index < 0) index = randomVideos.length - 1
    if (index >= randomVideos.length) index = 0
    
    setIsTransitioning(true)
    setImageKey(prev => prev + 1) // Force image re-render
    setCurrentSlide(index)
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  const nextSlide = () => {
    showSlide(currentSlide + 1)
  }

  const prevSlide = () => {
    showSlide(currentSlide - 1)
  }

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  // Debug log to check if video changes
  useEffect(() => {
    if (randomVideos.length > 0) {
      const currentVideo = randomVideos[currentSlide]
      if (currentVideo) {
        console.log('Current video changed:', {
          id: currentVideo.id,
          title: currentVideo.title,
          thumbnail: currentVideo.thumbnail,
          slide: currentSlide
        })
      }
    }
  }, [randomVideos, currentSlide])

  if (randomVideos.length === 0) return null

  const currentVideo = randomVideos[currentSlide]
  
  // Get trending videos (most liked in the last 7 days)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const trendingVideos = allVideos
    .filter(video => {
      const videoDate = new Date(video.uploadDate || Date.now())
      return videoDate >= oneWeekAgo
    })
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 6)

  return (
    <div className="w-full mb-12">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Banner Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-400 text-xl">✨</span>
            <h2 className="text-2xl font-bold text-white">New</h2>
          </div>
          
          <div 
            className="relative aspect-video bg-dark-700 rounded-lg overflow-hidden cursor-pointer"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={nextSlide}
          >
            <Image
              key={`${currentVideo?.id || currentSlide}-${imageKey}`}
              src={currentVideo?.thumbnail || '/no-thumbnail.webp'}
              alt={currentVideo?.title || 'Featured Video'}
              width={800}
              height={450}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isTransitioning ? 'opacity-70 scale-105' : 'opacity-100 scale-100'
              }`}
              quality={95}
              priority={currentSlide === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute bottom-6 left-6 text-white max-w-lg">
              <h3 className="text-3xl font-bold mb-3">{currentVideo?.title || 'Featured Video'}</h3>
              <p className="text-sm text-gray-300 line-clamp-3 mb-4">
                The appearance of &quot;quirks,&quot; newly discovered super powers, has been steadily increasing over the years, with 80 percent of humanity possessing...
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/video/${currentVideo?.slug || currentVideo?.title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim() || 'video'}`
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Now
              </button>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute bottom-6 right-6 flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  prevSlide()
                }}
                className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  nextSlide()
                }}
                className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

        </div>

        {/* Trending Section */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-400 text-xl">✨</span>
            <h2 className="text-2xl font-bold text-white">Trending</h2>
          </div>
          
          <div className="space-y-3">
            {trendingVideos.map((video, index) => (
               <div key={video.id} className="flex gap-2 cursor-pointer hover:bg-dark-800 p-3 rounded-lg transition-colors" onClick={() => window.location.href = `/video/${video.slug || video.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()}`}>
                <div className="flex-shrink-0 w-16 h-12 flex items-center justify-center">
                  <span 
                    className="text-4xl font-bold italic"
                    style={{ color: settings.primaryColor || '#e69f05' }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-dark-700">
                  <Image
                    src={video.thumbnail || '/no-thumbnail.webp'}
                    alt={video.title}
                    width={64}
                    height={48}
                    sizes="64px"
                    className="w-full h-full object-cover"
                    quality={95}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                  <div className="text-xs text-dark-400 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-primary-500" />
                      <span>{formatNumber(video.views)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-red-400">❤️</span>
                      <span>{formatNumber(video.likes || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}