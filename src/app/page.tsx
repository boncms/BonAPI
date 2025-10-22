'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dbService from '@/lib/database-client'
import { clientCacheService } from '@/lib/cache-client'
import { Video, Category, Model } from '@/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import VideoCard from '@/components/VideoCard'
import VideoCardPremium from '@/components/VideoCardPremium'
import CustomSection from '@/components/CustomSection'
import dynamic from 'next/dynamic'
const VideoCarousel = dynamic(() => import('@/components/VideoCarousel'), {
  ssr: false,
  loading: () => (
    <div className="w-full mb-12">
      <div className="relative w-full h-80 sm:h-96 overflow-hidden rounded-lg bg-dark-800 animate-pulse" />
    </div>
  )
})
import ModelCard from '@/components/ModelCard'
import CategoryCard from '@/components/CategoryCard'
import { useSettings } from '@/contexts/SettingsContext'
import { formatNumber } from '@/lib/utils'
import { Eye } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import AdBanner from '@/components/AdBanner'
import SavedLink from '@/components/SavedLink'
import ScrollToTop from '@/components/ScrollToTop'

export default function Home() {
  const { settings } = useSettings()
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([])
  const [onlyfansVideos, setOnlyfansVideos] = useState<Video[]>([])
  const [hotWeeklyVideos, setHotWeeklyVideos] = useState<Video[]>([])
  const [featuredModels, setFeaturedModels] = useState<Model[]>([])
  const [mostViewedVideos, setMostViewedVideos] = useState<Video[]>([])
  const [randomVideos, setRandomVideos] = useState<Video[]>([])
  const [crazyCategories, setCrazyCategories] = useState<{ name: string; totalViews: number; videoCount: number }[]>([])
  const [customSections, setCustomSections] = useState<any[]>([])
  const [allVideos, setAllVideos] = useState<Video[]>([])

  useEffect(() => {
    const loadEssential = async () => {
      try {
        // Load essential data with all videos for better performance
        const [videos, models, featuredAll, hotWeekly, mostViewed, customSectionsData] = await Promise.all([
          clientCacheService.getOrSet('homepage:videos', () => dbService.getVideos()),
          clientCacheService.getOrSet('homepage:models', () => dbService.getModels()),
          dbService.getFeaturedVideos(), // Don't cache featured videos to ensure fresh data
          clientCacheService.getOrSet('homepage:hotWeekly', () => dbService.getHotWeekly(100)),
          clientCacheService.getOrSet('homepage:mostViewed', () => dbService.getMostViewedVideos(10)),
          clientCacheService.getOrSet('homepage:customSections', () => dbService.getCustomSections(true))
        ])

        setFeaturedVideos(featuredAll)
        setHotWeeklyVideos(hotWeekly)
        setAllVideos(videos)
        setCustomSections(customSectionsData || [])

        // Build stats from all videos
        const modelNameToStats = new Map<string, { videoCount: number; totalViews: number }>()
        for (const v of videos as any[]) {
          const names = String(v.model || '').split(',').map((s: string) => s.trim()).filter(Boolean)
          for (const name of names) {
            const cur = modelNameToStats.get(name) || { videoCount: 0, totalViews: 0 }
            cur.videoCount += 1
            cur.totalViews += v.views || 0
            modelNameToStats.set(name, cur)
          }
        }

        // Only show models that actually have videos
        const merged = (models as any[]).map((m: any) => ({
          ...m,
          videoCount: modelNameToStats.get(m.name)?.videoCount ?? m.videoCount ?? 0,
          totalViews: modelNameToStats.get(m.name)?.totalViews ?? m.totalViews ?? 0,
        })).filter((m: any) => m.videoCount > 0) // Only show models with videos

        // Randomize order for homepage display
        const sorted = merged.sort((a: any, b: any) => (b.videoCount - a.videoCount) || (b.totalViews - a.totalViews))
        const randomized = [...sorted].sort(() => Math.random() - 0.5)
        setFeaturedModels(randomized)
        setMostViewedVideos(mostViewed)

        // Stats are calculated in components as needed
        // Idle tasks: random, onlyfans, categories
        const idle = (cb: () => void) => (
          (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 200)
        )
        idle(async () => {
          try {
            const [random, onlyfans] = await Promise.all([
              clientCacheService.getOrSet('homepage:random', () => dbService.getRandomVideos(10)),
              clientCacheService.getOrSet('homepage:onlyfans', () => dbService.getVideosOnlyfans(100))
            ])
            setAllVideos(videos)
            setOnlyfansVideos(onlyfans)
            setRandomVideos(random)
            
            // Calculate category counts from all videos (same logic as categories page)
            const categoryNameToCount = new Map<string, { totalViews: number; videoCount: number }>()
            for (const vid of videos as any[]) {
              const tokens = String(vid.category || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
              for (const token of tokens) {
                const cur = categoryNameToCount.get(token) || { totalViews: 0, videoCount: 0 }
                cur.totalViews += vid.views || 0
                cur.videoCount += 1
                categoryNameToCount.set(token, cur)
              }
            }
            const catAgg = Array.from(categoryNameToCount.entries()).map(([name, agg]) => ({ name, ...agg }))
            setCrazyCategories(catAgg)
          } catch {}
        })
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadEssential()
  }, [])

  // Listen for cache clear events from admin
  useEffect(() => {
    const handleClearCache = async () => {
      // Clear all relevant caches
      clientCacheService.delete('homepage:featured')
      clientCacheService.delete('homepage:videos')
      clientCacheService.delete('homepage:models')
      clientCacheService.delete('homepage:hotWeekly')
      clientCacheService.delete('homepage:mostViewed')
      clientCacheService.delete('homepage:customSections')
      clientCacheService.delete('homepage:random')
      clientCacheService.delete('homepage:onlyfans')
      
      // Force reload all data
      try {
        const [featuredAll, videos, models, hotWeekly, mostViewed, customSectionsData] = await Promise.all([
          dbService.getFeaturedVideos(),
          dbService.getVideos(),
          dbService.getModels(),
          dbService.getHotWeekly(100),
          dbService.getMostViewedVideos(10),
          dbService.getCustomSections(true)
        ])
        
        setFeaturedVideos(featuredAll)
        setAllVideos(videos)
        setCustomSections(customSectionsData || [])
        
        // Rebuild model stats
        const modelNameToStats = new Map<string, { videoCount: number; totalViews: number }>()
        for (const v of videos as any[]) {
          const names = String(v.model || '').split(',').map((s: string) => s.trim()).filter(Boolean)
          for (const name of names) {
            const cur = modelNameToStats.get(name) || { videoCount: 0, totalViews: 0 }
            cur.videoCount += 1
            cur.totalViews += v.views || 0
            modelNameToStats.set(name, cur)
          }
        }
        
        const merged = (models as any[]).map((m: any) => ({
          ...m,
          videoCount: modelNameToStats.get(m.name)?.videoCount ?? m.videoCount ?? 0,
          totalViews: modelNameToStats.get(m.name)?.totalViews ?? m.totalViews ?? 0,
        })).filter((m: any) => m.videoCount > 0)
        
        const randomized = [...merged].sort(() => Math.random() - 0.5)
        setFeaturedModels(randomized)
        setMostViewedVideos(mostViewed)
        setHotWeeklyVideos(hotWeekly)
        
        // Rebuild category stats
        const categoryNameToCount = new Map<string, { totalViews: number; videoCount: number }>()
        for (const vid of videos as any[]) {
          const tokens = String(vid.category || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
          for (const token of tokens) {
            const cur = categoryNameToCount.get(token) || { totalViews: 0, videoCount: 0 }
            cur.totalViews += vid.views || 0
            cur.videoCount += 1
            categoryNameToCount.set(token, cur)
          }
        }
        const catAgg = Array.from(categoryNameToCount.entries()).map(([name, agg]) => ({ name, ...agg }))
        setCrazyCategories(catAgg)
        
        console.log('✅ All data reloaded after cache clear')
      } catch (error) {
        console.error('Error reloading data after cache clear:', error)
      }
    }

    window.addEventListener('clearHomepageCache', handleClearCache)
    return () => window.removeEventListener('clearHomepageCache', handleClearCache)
  }, [])

  return (
    <div className="min-h-screen bg-dark-900">
        <Header />
        
        <main className="container py-4 sm:py-6 lg:py-8">
          {/* Featured Videos Carousel - Full Width */}
          <VideoCarousel videos={featuredVideos} />
          
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Featured Videos */}
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Image src="/icons/featured_videos.png" alt="Featured Videos" width={32} height={32} className="w-8 h-8" />
                    Featured Videos
                  </h2>
                  <Link prefetch href="/featured" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredVideos.length === 0 ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-video bg-dark-800 rounded" />
                        <div className="mt-3 h-4 bg-dark-800 rounded w-3/4" />
                      </div>
                    ))
                  ) : (
                    featuredVideos.slice(0, settings.homepageFeaturedPerPage || 30).map((video, idx) => (
                      <VideoCard key={video.id} video={video} priority={idx < 4} />
                    ))
                  )}
                </div>
                {/* Homepage feature banner ad */}
                <div className="mt-6">
                  <AdBanner position="homepage_ads_feature" fallbackTitle="Homepage Banner" />
                </div>
              </section>

              {/* Custom Sections */}
              {(() => {
                return customSections && customSections.length > 0 ? (
                  customSections.map((section) => {
                    return <CustomSection key={section.id} section={section} />
                  })
                ) : (
                  <section className="mb-12">
                    <div className="text-center py-8">
                      

                    </div>
                  </section>
                )
              })()}

              {/* Hot Weekly */}
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Image src="/icons/hot.png" alt="Hot Weekly" width={32} height={32} className="w-8 h-8" />
                    Hot Weekly
                  </h2>
                  <Link prefetch href="/hot-weekly" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {hotWeeklyVideos.slice(0, settings.homepageHotWeeklyCount || 15).map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>

              {/* Featured Models */}
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Image src="/icons/model.png" alt="Models" width={32} height={32} className="w-8 h-8" />
                    Models
                  </h2>
                  <Link prefetch href="/models" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {featuredModels.slice(0, settings.homepageModelsCount || 12).map((model) => (
                    <ModelCard key={(model as any).id ? `id-${(model as any).id}` : `name-${model.name}`} model={model as any} size="sm" />
                  ))}
                </div>
                {/* Homepage models banner ad */}
                <div className="mt-6">
                  <AdBanner position="homepage_ads_model" fallbackTitle="Homepage Banner" />
                </div>
              </section>

              {/* Crazy Categories */}
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Image src="/icons/cate.png" alt="Crazy Categories" width={32} height={32} className="w-8 h-8" />
                    Crazy Categories
                  </h2>
                  <Link prefetch href="/categories" className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View More</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {crazyCategories.slice(0, settings.homepageCrazyCategoriesCount || 12).map(cat => (
                    <CategoryCard key={cat.name} category={{ id: 0, name: cat.name, description: '', videoCount: cat.videoCount }} />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <Sidebar
              showFeatured
              showMostViewed
              showRandom
              featuredVideos={featuredVideos.slice(0, 5)}
              mostViewedVideos={mostViewedVideos.slice(0, 5)}
              randomVideos={randomVideos.slice(0, 5)}
            />
          </div>
        </main>
        
        <Footer />
        
        {/* Saved Link Floating */}
        <SavedLink />
        
        {/* Scroll to Top Button */}
        <ScrollToTop />
      </div>
  )
}
