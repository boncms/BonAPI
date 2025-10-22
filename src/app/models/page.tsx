'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import dbService from '@/lib/database-client'
import { Model, Video } from '@/types'
import Header from '@/components/Header'
import ModelCard from '@/components/ModelCard'
import DynamicTitle from '@/components/DynamicTitle'
import { Search } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import SavedLink from '@/components/SavedLink'
import ScrollToTop from '@/components/ScrollToTop'

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('viewed')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const modelsPerPage = 24

  const loadModels = useCallback(async (page: number, search: string, sort: string) => {
    try {
      setLoading(true)
      const offset = (page - 1) * modelsPerPage
      
      // Load paginated models
      const response = await fetch(`/api/models?limit=${modelsPerPage}&offset=${offset}&search=${encodeURIComponent(search)}&sortBy=${sort}`)
      const data = await response.json()
      
      if (data.success) {
        setModels(data.models)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
      
      // Load videos for sidebar (only once)
      if (videos.length === 0) {
        const v = await dbService.getVideos()
        setVideos(v)
      }
    } catch (e) {
      console.error('Failed to load models', e)
    } finally {
      setLoading(false)
    }
  }, [modelsPerPage, videos.length])

  useEffect(() => {
    loadModels(currentPage, searchQuery, sortBy)
  }, [currentPage, searchQuery, sortBy, loadModels])

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, sortBy, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Header />
        <div className="container py-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      <DynamicTitle />
      <Header />
      
      <main className="container py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
                <Image src="/icons/model.png" alt="Models" width={48} height={48} className="w-12 h-12" />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Models</h2>
              </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <div className="relative w-full sm:w-auto sm:min-w-[260px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 sm:pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('viewed')}
                className={`px-3 md:px-4 py-2 rounded transition-colors ${
                  sortBy === 'viewed'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Most Viewed
              </button>
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-3 md:px-4 py-2 rounded transition-colors ${
                  sortBy === 'alphabetical'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Alphabetical
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 md:px-4 py-2 rounded transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1">
            {/* Models Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {models.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>

            {/* No results message */}
            {models.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-dark-400 text-lg">No models found</p>
                <p className="text-dark-500 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 sm:mt-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 md:px-4 py-2 bg-dark-700 text-dark-300 rounded hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 md:px-4 py-2 rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 md:px-4 py-2 bg-dark-700 text-dark-300 rounded hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Page Info */}
            {total > 0 && (
              <div className="text-center mt-4 text-dark-400 text-sm">
                Showing {((currentPage - 1) * modelsPerPage) + 1} to {Math.min(currentPage * modelsPerPage, total)} of {total} models
              </div>
            )}
          </div>
          <Sidebar
            showFeatured
            showMostViewed
            showRandom
            featuredVideos={videos.filter(v => v.featured).slice(0, 5)}
            mostViewedVideos={[...videos].sort((a, b) => b.views - a.views).slice(0, 5)}
            randomVideos={[...videos].sort(() => 0.5 - Math.random()).slice(0, 5)}
          />
        </div>
      </main>
      
      {/* Saved Link Floating */}
      <SavedLink />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}
