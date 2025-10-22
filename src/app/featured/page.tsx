'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dbService from '@/lib/database-client'
import { Video } from '@/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import VideoCard from '@/components/VideoCard'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import DynamicTitle from '@/components/DynamicTitle'
import DynamicTheme from '@/components/DynamicTheme'
import Sidebar from '@/components/Sidebar'

export default function FeaturedPage() {
  const { settings } = useSettings()
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([])
  const [mostViewedVideos, setMostViewedVideos] = useState<Video[]>([])
  const [randomVideos, setRandomVideos] = useState<Video[]>([])
  const [page, setPage] = useState(1)
  const itemsPerPage = 30

  useEffect(() => {
    const loadData = async () => {
      try {
        // Clear cache first
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cache_videos:featured')
          sessionStorage.removeItem('cache_videos:featured')
        }
        
        const [featured, mostViewed, random] = await Promise.all([
          dbService.getFeaturedVideos(),
          dbService.getMostViewedVideos(10),
          dbService.getRandomVideos(10)
        ])
        
        setFeaturedVideos(featured)
        setMostViewedVideos(mostViewed)
        setRandomVideos(random)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [])

  const totalPages = Math.ceil(featuredVideos.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentVideos = featuredVideos.slice(startIndex, endIndex)

  return (
    <SettingsProvider>
      <DynamicTitle />
      <DynamicTheme />
      <div className="min-h-screen bg-dark-900">
        <Header />
        
        <main className="container py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <Image src="/icons/featured_videos.png" alt="Featured Videos" width={48} height={48} className="w-12 h-12" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Featured Videos</h2>
                </div>
                <p className="text-dark-300">Discover our handpicked collection of premium content</p>
              </div>

              {currentVideos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Image src="/icons/featured_videos.png" alt="No Featured Videos" width={64} height={64} className="w-16 h-16 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Featured Videos</h3>
                  <p className="text-dark-300 mb-6">There are currently no featured videos. Check back later!</p>
                  <a 
                    href="/videos" 
                    className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Browse All Videos
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                  {currentVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === 1 
                        ? 'bg-dark-700 text-dark-400 cursor-not-allowed' 
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                    onClick={() => setPage(p => Math.max(1, p-1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-300 text-sm">Page</span>
                    <span className="bg-primary-600 text-white px-3 py-1 rounded text-sm font-medium">{page}</span>
                    <span className="text-dark-300 text-sm">of {totalPages}</span>
                  </div>
                  <button 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page >= totalPages
                        ? 'bg-dark-700 text-dark-400 cursor-not-allowed' 
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                    onClick={() => setPage(p => p+1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <Sidebar
              showMostViewed
              showRandom
              mostViewedVideos={mostViewedVideos}
              randomVideos={randomVideos}
            />
          </div>
        </main>
        
        <Footer />
      </div>
    </SettingsProvider>
  )
}
