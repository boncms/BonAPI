'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Head from 'next/head'
import dbService from '@/lib/database-client'
import { Category, Video } from '@/types'
import Header from '@/components/Header'
import VideoCard from '@/components/VideoCard'
import Sidebar from '@/components/Sidebar'

export default function CategoryPage() {
  const params = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [categoryVideos, setCategoryVideos] = useState<Video[]>([])
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const videosPerPage = 20
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const slug = params.slug as string
        
        // Load categories from API
        const categoriesResponse = await fetch('/api/categories?limit=1000&offset=0')
        const categoriesData = await categoriesResponse.json()
        const cats = categoriesData.success ? categoriesData.categories : []
        
        const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
        const foundCategory = cats.find((c: any) => toSlug(c.name) === slug) || null

        // Load all videos directly (same as categories page)
        const vids = await dbService.getVideos()
        setAllVideos(vids)
        
        if (foundCategory) {
          const vidsByCat = vids.filter((v: any) => {
            const categoriesField = String(v.category || '')
            return categoriesField.split(',').map((s: string) => s.trim()).some((c: string) => c === foundCategory.name)
          })
          setCategory({ ...foundCategory, videoCount: vidsByCat.length })
          setCategoryVideos(vidsByCat)
        } else {
          // Fallback: derive by slug from videos' category field (supports comma-separated and case-insensitive)
          const matchedVideos = vids.filter((v: any) => {
            const categoriesField = String(v.category || '')
            return categoriesField
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
              .some((c: string) => toSlug(c) === slug)
          })

          if (matchedVideos.length > 0) {
            // Pick a display name from the first matched video's matching category token
            let displayName = slug.replace(/-/g, ' ')
            const first = matchedVideos[0]
            const tokens = String(first.category || '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
            const tokenMatch = tokens.find((t: string) => toSlug(t) === slug)
            if (tokenMatch) displayName = tokenMatch

            setCategory({ id: 0, name: displayName, description: '', videoCount: matchedVideos.length } as any)
            setCategoryVideos(matchedVideos)
          } else {
            setCategory(null)
            setCategoryVideos([])
          }
        }
      } catch (error) {
        console.error('Error loading category data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    setCurrentPage(1) // Reset to first page when category changes
  }, [params.slug])

  // Calculate pagination
  const totalPages = Math.ceil(categoryVideos.length / videosPerPage)
  const startIndex = (currentPage - 1) * videosPerPage
  const endIndex = startIndex + videosPerPage
  const currentVideos = categoryVideos.slice(startIndex, endIndex)

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

  if (!category) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Header />
        <div className="container py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <p>The category you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{category.name} Videos - xCMS</title>
        <meta name="description" content={`Watch ${category.name} videos. ${category.description || `Browse our collection of ${category.name} content.`} ${category.videoCount} videos available.`} />
        <meta name="keywords" content={`${category.name}, videos, ${category.name.toLowerCase()}, entertainment, streaming`} />
        <meta property="og:title" content={`${category.name} Videos - xCMS`} />
        <meta property="og:description" content={`Watch ${category.name} videos. ${category.description || `Browse our collection of ${category.name} content.`}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${category.name} Videos - xCMS`} />
        <meta name="twitter:description" content={`Watch ${category.name} videos. ${category.description || `Browse our collection of ${category.name} content.`}`} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": `${category.name} Videos`,
              "description": category.description || `Browse our collection of ${category.name} content`,
              "url": `https://yoursite.com/category/${params.slug}`,
              "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": category.videoCount,
                "itemListElement": categoryVideos.slice(0, 10).map((video, index) => ({
                  "@type": "VideoObject",
                  "position": index + 1,
                  "name": video.title,
                  "description": video.description,
                  "duration": video.duration,
                  "thumbnailUrl": video.thumbnail,
                  "uploadDate": video.uploadDate,
                  "interactionStatistic": {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/WatchAction",
                    "userInteractionCount": video.views
                  }
                }))
              }
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-dark-900 overflow-x-hidden">
        <Header />
        
        <main className="container py-4 sm:py-6 lg:py-8">
        {/* Category Info */}
        <div className="bg-dark-800 rounded-lg p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center">
              <div className="text-dark-400 text-2xl">📁</div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{category.name}</h1>
              <p className="text-dark-300 mb-4">{category.description}</p>
              <div className="text-sm text-dark-400">
                <span>{category.videoCount} videos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Category Videos */}
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
              {category.name} Videos ({categoryVideos.length} total)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* No results message */}
            {currentVideos.length === 0 && categoryVideos.length > 0 && (
              <div className="text-center py-12">
                <p className="text-dark-400 text-lg">No videos on this page</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-dark-700 text-dark-300 rounded hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`px-4 py-2 rounded transition-colors ${
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
                  className="px-4 py-2 bg-dark-700 text-dark-300 rounded hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <Sidebar
            showFeatured
            showMostViewed
            showRandom
            featuredVideos={allVideos.filter(v => v.featured)}
            mostViewedVideos={[...allVideos].sort((a, b) => b.views - a.views).slice(0, 5)}
            randomVideos={[...allVideos].sort(() => 0.5 - Math.random()).slice(0, 5)}
          />
        </div>
      </main>
      </div>
    </>
  )
}
