'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dbService from '@/lib/database-client'
import { Video } from '@/types'
import VideoCard from '@/components/VideoCard'
import ScrollToTop from '@/components/ScrollToTop'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DynamicTheme from '@/components/DynamicTheme'

export default function SavedVideosPage() {
  const [savedVideos, setSavedVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSavedVideos = async () => {
      try {
        const savedIds = JSON.parse(localStorage.getItem('savedVideos') || '[]')
        
        if (savedIds.length === 0) {
          setSavedVideos([])
          setLoading(false)
          return
        }

        // Fetch video details for saved IDs
        const videos = await Promise.all(
          savedIds.map(async (id: number) => {
            try {
              return await dbService.getVideoById(id)
            } catch (error) {
              console.error(`Error fetching video ${id}:`, error)
              return null
            }
          })
        )

        // Filter out null values and set videos
        const validVideos = videos.filter((video): video is Video => video !== null)
        setSavedVideos(validVideos)
      } catch (error) {
        console.error('Error loading saved videos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSavedVideos()
  }, [])

  const removeFromSaved = (videoId: number) => {
    const savedIds = JSON.parse(localStorage.getItem('savedVideos') || '[]')
    const updatedIds = savedIds.filter((id: number) => id !== videoId)
    localStorage.setItem('savedVideos', JSON.stringify(updatedIds))
    setSavedVideos(prev => prev.filter(video => video.id !== videoId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <DynamicTheme />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Saved Videos</h1>
          <p className="text-dark-300">
            {savedVideos.length} video{savedVideos.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Videos Grid */}
        {savedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {savedVideos.map((video) => (
              <div key={video.id} className="relative group">
                <VideoCard video={video} />
                <button
                  onClick={() => removeFromSaved(video.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from saved"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold mb-2">No saved videos yet</h2>
            <p className="text-dark-300 mb-6">
              Start saving videos you love by clicking the heart icon on any video
            </p>
            <Link
              href="/videos"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Videos
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
      <ScrollToTop />
    </div>
  )
}
