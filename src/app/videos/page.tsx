'use client'

import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PaginatedVideoGrid from '@/components/PaginatedVideoGrid'
import VideoFilter from '@/components/VideoFilter'
import { useSearchParams } from 'next/navigation'

function VideosContent() {
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const model = searchParams.get('model') || ''
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const models = searchParams.get('models')?.split(',').filter(Boolean) || []
  const sortBy = (searchParams.get('sortBy') as 'newest' | 'oldest' | 'most_viewed' | 'most_liked') || 'newest'
  const dateRange = (searchParams.get('dateRange') as 'all' | 'today' | 'week' | 'month' | 'year') || 'all'

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {search ? `Search Results for "${search}"` : 
             category ? `Category: ${category}` :
             model ? `Model: ${model}` :
             'All Videos'}
          </h1>
          <p className="text-gray-400">
            Browse through our collection of videos
          </p>
            </div>

        <VideoFilter />

        <PaginatedVideoGrid 
          initialPage={page}
          limit={20}
          className="mb-8"
          search={search}
          categories={categories}
          models={models}
          sortBy={sortBy}
          dateRange={dateRange}
        />
      </main>

      <Footer />
    </div>
  )
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-dark-700 rounded-t-lg"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-dark-700 rounded w-3/4"></div>
                  <div className="h-3 bg-dark-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    }>
      <VideosContent />
    </Suspense>
  )
}
