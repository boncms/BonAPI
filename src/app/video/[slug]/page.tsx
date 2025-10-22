'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dbService from '@/lib/database-client'
import { clientCacheService } from '@/lib/cache-client'
import { Video } from '@/types'
import VideoPlayer from '@/components/VideoPlayer'
import VideoActions from '@/components/VideoActions'
import SavedLink from '@/components/SavedLink'
import { ToastManager, useToast } from '@/components/Toast'
import ScrollToTop from '@/components/ScrollToTop'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import VideoSEO from '@/components/VideoSEO'
import DynamicTitle from '@/components/DynamicTitle'
import DynamicTheme from '@/components/DynamicTheme'
import AdBanner from '@/components/AdBanner'
import Sidebar from '@/components/Sidebar'
import { formatNumber, createSlug } from '@/lib/utils'
import { ArrowLeft, Play, Eye } from 'lucide-react'

export default function VideoDetailPage() {
  const params = useParams()
  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [randomVideos, setRandomVideos] = useState<Video[]>([])
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toasts, removeToast, showSuccess } = useToast()
  const [showSavedModal, setShowSavedModal] = useState(false)

  const toSlug = (name: string) => name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')

  const loadVideo = useCallback(async () => {
    try {
      setLoading(true)
      const slug = params.slug as string
      
      // Get video data directly from database (no API exposure)
      let foundVideo: Video | null = null
      let videosList: Video[] = []
      
      // Try API first for better performance
      try {
        const res = await fetch(`/api/videos/slug/${slug}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.success && data.video) {
            foundVideo = data.video as Video
          }
        }
      } catch (apiError) {
        // API failed, will fallback to client cache
      }
      
      // Fallback: Load all videos with cache if API failed
      if (!foundVideo) {
        // Load all videos with cache
        videosList = await clientCacheService.getOrSet('video:all', () => dbService.getVideos())
        setAllVideos(videosList)
        
        // Find video by slug
        foundVideo = videosList.find((v: Video) => v.slug === slug || createSlug(v.title) === slug) || null
      } else {
        // Load sidebar videos in background
        const loadSidebarVideos = async () => {
          try {
            videosList = await clientCacheService.getOrSet('video:all', () => dbService.getVideos())
            setAllVideos(videosList)
          } catch (error) {
            // Silent fail for sidebar
          }
        }
        loadSidebarVideos()
      }
      
      if (foundVideo) {
        // Get video stream URL separately for security
        if (foundVideo.id) {
          try {
            const streamRes = await fetch(`/api/video/${foundVideo.id}/stream`, { cache: 'no-store' })
            if (streamRes.ok) {
              const streamData = await streamRes.json()
              if (streamData?.success && streamData.video) {
                foundVideo.videoUrl = streamData.video.videoUrl
                foundVideo.videoUrlType = streamData.video.videoUrlType
              }
            }
          } catch (streamError) {
            // Failed to fetch video stream
          }
        }
        
        setVideo(foundVideo)
        
        // related and random videos are computed below
        
        // Load related videos (same category, excluding current video)
        const related = videosList
          .filter((v: Video) => v.id !== foundVideo.id && v.category === foundVideo.category)
          .slice(0, 6)
        setRelatedVideos(related)
        
        // Load random videos (different from current and related)
        const random = videosList
          .filter((v: Video) => v.id !== foundVideo.id && !related.some((r: Video) => r.id === v.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
        setRandomVideos(random)
        
        // Store featured fallback in state via allVideos; we'll recompute on render
      } else {
        setError('Video not found')
      }
    } catch (err) {
      console.error('Error loading video:', err)
      setError('Failed to load video')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    loadVideo()
  }, [loadVideo])

  const handleViewIncrement = async () => {
    if (video) {
      try {
        await dbService.incrementVideoViews(video.id)
        setVideo(prev => prev ? { ...prev, views: prev.views + 1 } : null)
      } catch (error) {
        console.error('Error incrementing view:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <main className="container py-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-dark-900">
        <main className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Video Not Found</h1>
            <p className="text-dark-300 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Compute featured list with fallback to top viewed (excluding current video)
  const featuredForSidebar = (() => {
    const excludeId = video?.id
    let picks = allVideos
      .filter(v => (excludeId ? v.id !== excludeId : true) && v.featured)
      .slice(0, 3)
    if (picks.length < 3) {
      const fillers = allVideos
        .filter(v => (excludeId ? v.id !== excludeId : true) && !picks.some(p => p.id === v.id))
        .sort((a, b) => b.views - a.views)
        .slice(0, 3 - picks.length)
      picks = [...picks, ...fillers]
    }
    return picks
  })()

  return (
    <div className="min-h-screen bg-dark-900">
      {/* SEO and Dynamic Updates */}
      {video && (
        <>
          <VideoSEO video={video} />
        </>
      )}
      <DynamicTheme />
      <Header />
      
      <main className="container py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 max-w-full lg:max-w-4xl">
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-dark-300 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Video Player */}
            <div className="mb-6">
              <VideoPlayer 
                video={video} 
                onViewIncrement={handleViewIncrement}
              />
            </div>

            {/* Sponsored Content */}
            <div className="mb-8">
              <AdBanner position="top" fallbackTitle="Sponsored Content" />
            </div>

            {/* Video Info */}
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              {/* Title and Stats */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
                <div className="flex items-center gap-6 text-dark-300 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-primary-500" />
                    <span>{formatNumber(video.views)}</span>
                  </div>
                  <span>{video.likes.toLocaleString()} likes</span>
                  <span>{video.dislikes.toLocaleString()} dislikes</span>
                  <span>{video.duration}</span>
                </div>
              </div>

              {/* Description */}
              {video.description && (
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-dark-700/50">
                  <h3 className="text-xl font-bold text-white mb-3">Description</h3>
                  <p className="text-dark-300 leading-relaxed">{video.description}</p>
                </div>
              )}

              {/* Tags */}
              {video.tags && Array.isArray(video.tags) && video.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-dark-700 text-dark-300 rounded-full text-sm hover:bg-dark-600 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Model and Category */}
              <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-dark-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Model Section */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Model
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {String(video.model || '')
                        .split(',')
                        .map(m => m.trim())
                        .filter(Boolean)
                        .map((m, idx) => (
                          <Link 
                            key={`${m}-${idx}`} 
                            href={`/model/${toSlug(m)}`} 
                            className="inline-flex items-center px-3 py-2 bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 hover:text-primary-300 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            {m}
                          </Link>
                        ))}
                    </div>
                  </div>

                  {/* Category Section */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Category
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {String(video.category || '')
                        .split(',')
                        .map(c => c.trim())
                        .filter(Boolean)
                        .map((c, idx) => (
                          <Link 
                            key={`${c}-${idx}`} 
                            href={`/category/${toSlug(c)}`} 
                            className="inline-flex items-center px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            {c}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-dark-700">
                <VideoActions
                  videoId={video.id}
                  initialLikes={video.likes}
                  initialDislikes={video.dislikes}
                  onLike={(likes) => {
                    setVideo(prev => prev ? { ...prev, likes } : null)
                    showSuccess(`Liked! ${likes} likes`)
                  }}
                  onDislike={(dislikes) => {
                    setVideo(prev => prev ? { ...prev, dislikes } : null)
                    showSuccess(`Disliked! ${dislikes} dislikes`)
                  }}
                  onShare={() => {
                    showSuccess('Link copied to clipboard!')
                  }}
                  onSave={() => {
                    setShowSavedModal(true)
                  }}
                  onScrollToTop={() => {
                    showSuccess('Scrolled to top!')
                  }}
                />
              </div>
            </div>

            {/* Advertisement */}
            <div className="mt-12 mb-8">
              <AdBanner position="inline" fallbackTitle="Advertisement" />
            </div>

            {/* Related Videos Section */}
            {relatedVideos.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Related Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                  {relatedVideos.map((relatedVideo) => (
                    <div
                      key={relatedVideo.id}
                      className="bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/video/${relatedVideo.slug || relatedVideo.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-dark-700">
                        <Image
                          src={relatedVideo.thumbnail || '/no-thumbnail.webp'}
                          alt={relatedVideo.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                          {relatedVideo.duration}
                        </div>
                      </div>
                      
                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors mb-2">
                          {relatedVideo.title}
                        </h3>
                        <p className="text.sm text-dark-300 mb-2">{relatedVideo.model}</p>
                        <div className="flex items-center gap-4 text-xs text-dark-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-primary-500" />
                            <span>{formatNumber(relatedVideo.views)}</span>
                          </div>
                          <span>{relatedVideo.likes.toLocaleString()} likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended */}
            <div className="mt-12 mb-8">
              <AdBanner position="bottom" fallbackTitle="Recommended for You" />
            </div>

            {/* Random Videos Section */}
            {randomVideos.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                  {randomVideos.map((randomVideo) => (
                    <div
                      key={randomVideo.id}
                      className="bg-dark-800 rounded-lg overflow-hidden hover:bg-dark-700 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/video/${randomVideo.slug || randomVideo.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-dark-700">
                        <Image
                          src={randomVideo.thumbnail || '/no-thumbnail.webp'}
                          alt={randomVideo.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                          {randomVideo.duration}
                        </div>
                      </div>
                      
                      {/* Video Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors mb-1">
                          {randomVideo.title}
                        </h3>
                        <p className="text-xs text-dark-300 mb-1">{randomVideo.model}</p>
                        <div className="flex items-center gap-2 text-xs text-dark-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-primary-500" />
                            <span>{formatNumber(randomVideo.views)}</span>
                          </div>
                          <span>•</span>
                          <span>{randomVideo.likes.toLocaleString()} likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Sidebar 
            showFeatured
            featuredVideos={featuredForSidebar}
            showMostViewed 
            mostViewedVideos={allVideos.filter(v => v.id !== video!.id).sort((a, b) => b.views - a.views).slice(0, 5)}
            showRandom
            randomVideos={randomVideos.slice(0, 5)}
          />
        </div>
      </main>
      
      {/* Toast Notifications */}
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Footer */}
      <Footer />

      {/* Saved Link Floating */}
      <SavedLink />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Saved Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-white text-lg font-semibold mb-2">Saved</h3>
            <p className="text-dark-300 mb-4">Video saved successfully! ❤️</p>
            <button
              onClick={() => setShowSavedModal(false)}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}