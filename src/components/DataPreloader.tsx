'use client'

import { useEffect } from 'react'
import { clientCacheService } from '@/lib/cache-client'
import dbService from '@/lib/database-client'

// Preload critical data for faster navigation
export default function DataPreloader() {
  useEffect(() => {
    // Preload essential data when user hovers over navigation links
    const preloadData = async () => {
      try {
        // Preload categories and models for faster navigation
        await Promise.all([
          clientCacheService.getOrSet('homepage:categories', () => dbService.getCategories()),
          clientCacheService.getOrSet('homepage:models', () => dbService.getModels())
        ])
      } catch (error) {
        // Silent fail - preloading is optional
      }
    }

    // Preload on idle
    if (typeof window !== 'undefined') {
      const preloadOnIdle = () => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(preloadData)
        } else {
          setTimeout(preloadData, 1000)
        }
      }
      
      preloadOnIdle()
    }
  }, [])

  return null // This component doesn't render anything
}
