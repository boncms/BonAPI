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

export default function HotWeeklyPage() {
  const { settings } = useSettings()
  const [hotWeeklyVideos, setHotWeeklyVideos] = useState<Video[]>([])
  const [mostViewedVideos, setMostViewedVideos] = useState<Video[]>([])
  const [randomVideos, setRandomVideos] = useState<Video[]>([])
  const [page, setPage] = useState(1)
  const itemsPerPage = 30

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hotWeekly, mostViewed, random] = await Promise.all([
          dbService.getHotWeekly(1000),
          dbService.getMostViewedVideos(10),
          dbService.getRandomVideos(10)
        ])
        
        setHotWeeklyVideos(hotWeekly)
        setMostViewedVideos(mostViewed)
        setRandomVideos(random)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [])

  const totalPages = Math.ceil(hotWeeklyVideos.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentVideos = hotWeeklyVideos.slice(startIndex, endIndex)

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
                <Image src="/icons/hot.png" alt="Hot Weekly" width={48} height={48} className="w-12 h-12" />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Hot Weekly</h2>
              </div>
                <p className="text-dark-300">Trending videos from the past week</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {currentVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>

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
