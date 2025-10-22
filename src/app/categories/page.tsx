'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Category, Video } from '@/types'
import dbService from '@/lib/database-client'
import Header from '@/components/Header'
import CategoryCard from '@/components/CategoryCard'
import DynamicTitle from '@/components/DynamicTitle'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import SavedLink from '@/components/SavedLink'
import ScrollToTop from '@/components/ScrollToTop'

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 24

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [categoriesResponse, allVideos] = await Promise.all([
          fetch('/api/categories?limit=5000&offset=0'),
          dbService.getVideos()
        ])
        const categoriesData = await categoriesResponse.json()
        const cats: Category[] = categoriesData.success ? (categoriesData.categories as Category[]) : []

        // Recompute category counts from videos (robust split by commas)
        const categoryNameToCount = new Map<string, number>()
        for (const vid of allVideos as any[]) {
          const tokens = String(vid.category || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
          for (const token of tokens) {
            categoryNameToCount.set(token, (categoryNameToCount.get(token) || 0) + 1)
          }
        }

        const enriched = cats.map(c => ({
          ...c,
          videoCount: categoryNameToCount.get(c.name) || 0
        }))

        setCategories(enriched)
        setVideos(allVideos as Video[])
      } catch (e) {
        console.error('Failed to load categories/videos', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let filtered = [...categories]
    if (searchQuery) {
      filtered = filtered.filter(cat =>
        (cat.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (cat.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    }
    setFilteredCategories(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchQuery, categories, itemsPerPage])

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCategories.slice(startIndex, endIndex)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden touch-pan-y">
      <DynamicTitle />
      <Header />
      
      <main className="container py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
                <Image src="/icons/cate_1.png" alt="Categories" width={48} height={48} className="w-12 h-12" />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Categories</h2>
              </div>
          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 sm:pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1">
            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {getCurrentPageItems().map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex gap-1">
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
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
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
                  className="flex items-center gap-1 px-3 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Page Info */}
            {filteredCategories.length > 0 && (
              <div className="text-center mt-4 text-dark-400 text-sm">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} categories
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
