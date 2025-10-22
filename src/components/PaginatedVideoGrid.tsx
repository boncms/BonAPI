'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video } from '@/types'
import dbService from '@/lib/database-client'
import VideoCard from './VideoCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginatedVideoGridProps {
  initialPage?: number
  limit?: number
  className?: string
  search?: string
  categories?: string[]
  models?: string[]
  sortBy?: 'newest' | 'oldest' | 'most_viewed' | 'most_liked'
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year'
}

export default function PaginatedVideoGrid({ 
  initialPage = 1, 
  limit = 20, 
  className = '',
  search = '',
  categories = [],
  models = [],
  sortBy = 'newest',
  dateRange = 'all'
}: PaginatedVideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Build filter object
      const filters: any = {}
      if (search) filters.search = search
      if (categories.length > 0) filters.categories = categories
      if (models.length > 0) filters.models = models
      if (sortBy !== 'newest') filters.sortBy = sortBy
      if (dateRange !== 'all') filters.dateRange = dateRange
      
      const result = await dbService.getVideosPaginated(page, limit, filters)
      setVideos(result.videos)
      setTotalPages(result.totalPages)
      setTotal(result.total)
      setCurrentPage(page)
    } catch (err) {
      setError('Failed to load videos')
      console.error('Error loading videos:', err)
    } finally {
      setLoading(false)
    }
  }, [limit, search, categories, models, sortBy, dateRange])

  useEffect(() => {
    loadPage(currentPage)
  }, [currentPage, loadPage])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadPage(page)
    }
  }

  if (loading && videos.length === 0) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-video bg-dark-700 rounded-t-lg"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-dark-700 rounded w-3/4"></div>
              <div className="h-3 bg-dark-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => loadPage(currentPage)}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-dark-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page Numbers */}
          <div className="flex space-x-1">
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
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-white hover:bg-dark-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-dark-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className="text-center mt-4 text-sm text-gray-400">
        Page {currentPage} of {totalPages} ({total} videos total)
      </div>
    </div>
  )
}
