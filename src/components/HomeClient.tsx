'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Video, Model } from '@/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import VideoCard from '@/components/VideoCard'
import VideoCardPremium from '@/components/VideoCardPremium'
import CustomSection from '@/components/CustomSection'
import dynamic from 'next/dynamic'
const VideoCarousel = dynamic(() => import('@/components/VideoCarousel'), { ssr: false, loading: () => (
  <div className="w-full mb-12">
    <div className="relative w-full h-80 sm:h-96 overflow-hidden rounded-lg bg-dark-800 animate-pulse" />
  </div>
)})
import ModelCard from '@/components/ModelCard'
import CategoryCard from '@/components/CategoryCard'
import { useSettings } from '@/contexts/SettingsContext'
import Sidebar from '@/components/Sidebar'
import AdBanner from '@/components/AdBanner'
import SavedLink from '@/components/SavedLink'
import ScrollToTop from '@/components/ScrollToTop'

export default function HomeClient({
  featuredVideos,
  hotWeeklyVideos,
  featuredModels,
  crazyCategories,
  mostViewedVideos,
  randomVideos,
  customSections
}: {
  featuredVideos: Video[]
  hotWeeklyVideos: Video[]
  featuredModels: Model[]
  crazyCategories: { name: string; totalViews: number; videoCount: number }[]
  mostViewedVideos: Video[]
  randomVideos: Video[]
  customSections: any[]
}) {
  const { settings } = useSettings()
  const [page, setPage] = useState(1)

  const pageSize = settings.homepageFeaturedPerPage || 30
  const pageVideos = useMemo(() => (
    featuredVideos.slice((page - 1) * pageSize, page * pageSize)
  ), [featuredVideos, page, pageSize])

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="container py-4 sm:py-6 lg:py-8">
        <VideoCarousel videos={featuredVideos} />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1">
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Image src="/icons/featured_videos.png" alt="Featured Videos" width={32} height={32} className="w-8 h-8" />
                  Featured Videos
                </h2>
                <Link prefetch href="/featured" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {pageVideos.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-dark-800 rounded" />
                      <div className="mt-3 h-4 bg-dark-800 rounded w-3/4" />
                    </div>
                  ))
                ) : (
                  pageVideos.map((video, idx) => (
                    <VideoCard key={video.id} video={video} priority={idx < 4} />
                  ))
                )}
              </div>
              {featuredVideos.length > pageSize && (
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
                    <span className="text-dark-300 text-sm">of {Math.ceil(featuredVideos.length / pageSize)}</span>
                  </div>
                  <button 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page >= Math.ceil(featuredVideos.length / pageSize)
                        ? 'bg-dark-700 text-dark-400 cursor-not-allowed' 
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                    onClick={() => setPage(p => p+1)}
                    disabled={page >= Math.ceil(featuredVideos.length / pageSize)}
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="mt-6">
                <AdBanner position="homepage_ads_feature" fallbackTitle="Homepage Banner" />
              </div>
            </section>

            {customSections && customSections.length > 0 && customSections.map((section) => (
              <CustomSection key={section.id} section={section} />
            ))}

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Image src="/icons/hot.png" alt="Hot Weekly" width={32} height={32} className="w-8 h-8" />
                  Hot Weekly
                </h2>
                <Link prefetch href="/hot-weekly" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {hotWeeklyVideos.slice(0, (settings.homepageHotWeeklyCount || 15)).map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </section>

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Image src="/icons/model.png" alt="Models" width={32} height={32} className="w-8 h-8" />
                  Models
                </h2>
                <Link prefetch href="/models" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {featuredModels.slice(0, (settings.homepageModelsCount || 12)).map((model) => (
                  <ModelCard key={(model as any).id ? `id-${(model as any).id}` : `name-${model.name}`} model={model as any} size="sm" />
                ))}
              </div>
              <div className="mt-6">
                <AdBanner position="homepage_ads_model" fallbackTitle="Homepage Banner" />
              </div>
            </section>

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Image src="/icons/cate.png" alt="Crazy Categories" width={32} height={32} className="w-8 h-8" />
                  Crazy Categories
                </h2>
                <Link prefetch href="/categories" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {crazyCategories.slice(0, (settings.homepageCrazyCategoriesCount || 12)).map(cat => (
                  <CategoryCard key={cat.name} category={{ id: 0, name: cat.name, description: '', videoCount: cat.videoCount }} />
                ))}
              </div>
            </section>
          </div>

          <Sidebar
            showFeatured
            showMostViewed
            showRandom
            featuredVideos={featuredVideos.slice(0, 3)}
            mostViewedVideos={mostViewedVideos.slice(0, 5)}
            randomVideos={randomVideos.slice(0, 5)}
          />
        </div>
      </main>

      <Footer />
      <SavedLink />
      <ScrollToTop />
    </div>
  )
}


