'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dbService from '@/lib/database-client'
import { clientCacheService } from '@/lib/cache-client'
import { Model, Video } from '@/types'
import Header from '@/components/Header'
import VideoCard from '@/components/VideoCard'
import DynamicTitle from '@/components/DynamicTitle'
import { formatNumber } from '@/lib/utils'
import { Eye, Video as VideoIcon } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ModelAvatar from '@/components/ModelAvatar'
import SavedLink from '@/components/SavedLink'
import ScrollToTop from '@/components/ScrollToTop'

export default function ModelPage() {
  const params = useParams()
  const [model, setModel] = useState<Model | null>(null)
  const [modelVideos, setModelVideos] = useState<Video[]>([])
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const slug = params.slug as string
      // Use cache for model and video data (direct database access)
      const models = await clientCacheService.getOrSet('model:all', () => dbService.getModels())
      const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
      let foundModel = models.find(m => toSlug(m.name) === slug) || null
      if (!foundModel) {
        // Fallback: derive from videos' model tokens
        const vidsAll = await clientCacheService.getOrSet('video:all', () => dbService.getVideos())
        const match = vidsAll.find((v: any) => String(v.model || '')
          .split(',')
          .map((s: string) => s.trim())
          .some((token: string) => toSlug(token) === slug))
        if (match) {
          const token = String(match.model || '')
            .split(',')
            .map((s: string) => s.trim())
            .find((t: string) => toSlug(t) === slug)
          if (token) {
            foundModel = { id: 0, name: token, description: '', avatar: '', videoCount: 0, totalViews: 0 } as any
          }
        }
      }
      setModel(foundModel)

      const videos = await clientCacheService.getOrSet('video:all', () => dbService.getVideos())
      setAllVideos(videos)

      if (foundModel) {
        // robust match by tokens using slug compare
        const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
        const vids = videos.filter((v: any) => String(v.model || '')
          .split(',')
          .map((s: string) => s.trim())
          .some((token: string) => toSlug(token) === toSlug(foundModel!.name)))
        setModelVideos(vids)
      } else {
        setModelVideos([])
      }
      setLoading(false)
    }
    load()
  }, [params.slug])

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

  if (!model) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Header />
        <div className="container py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Model not found</h1>
            <p>The model you&apos;re looking for doesn&apos;t exist.</p>
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
        {/* Model Info */}
        <div className="bg-dark-800 rounded-lg p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <ModelAvatar model={model} size="lg" />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{model.name}</h1>
              <p className="text-dark-300 mb-4">{model.description}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-dark-400">
                <div className="flex items-center gap-1">
                  <VideoIcon className="w-4 h-4 text-primary-500" />
                  <span>{model.videoCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-primary-500" />
                  <span>{formatNumber(model.totalViews)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Model Videos */}
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Videos by {model.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {modelVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
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
      
      {/* Saved Link Floating */}
      <SavedLink />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}
