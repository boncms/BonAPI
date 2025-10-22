'use client'

import { useState, useEffect, useCallback } from 'react'
import { Ad } from '@/types'

interface AdBannerProps {
  position:
    | 'top'
    | 'inline'
    | 'bottom'
    | 'sidebar_1'
    | 'sidebar_2'
    | 'sidebar_3'
    | 'homepage_ads_feature'
    | 'homepage_ads_model'
  className?: string
  fallbackTitle?: string
}

export default function AdBanner({ position, className = "", fallbackTitle = "" }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAd = useCallback(async () => {
    try {
      const response = await fetch(`/api/ads?position=${position}&active=true`)
      const ads = await response.json()
      
      if (ads.length > 0) {
        // Round-robin rotation per position using localStorage
        const key = `adRotation:${position}`
        const current = parseInt(localStorage.getItem(key) || '0', 10)
        const nextIndex = (current + 1) % ads.length
        localStorage.setItem(key, String(nextIndex))
        const pick = ads[nextIndex]
        setAd(pick)
        
        // Track impression
        trackImpression(pick.id)
      }
    } catch (error) {
      console.error('Error loading ad:', error)
    } finally {
      setLoading(false)
    }
  }, [position])

  useEffect(() => {
    loadAd()
  }, [loadAd])


  const trackImpression = async (adId: number) => {
    try {
      await fetch(`/api/ads/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'impression' })
      })
    } catch (error) {
      console.error('Error tracking impression:', error)
    }
  }

  const trackClick = async (adId: number) => {
    try {
      await fetch(`/api/ads/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' })
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }

  const handleAdClick = () => {
    if (ad) {
      trackClick(ad.id)
    }
  }

  const isSidebar = position === 'sidebar_1' || position === 'sidebar_2' || position === 'sidebar_3'
  const isBanner = position === 'homepage_ads_feature' || position === 'homepage_ads_model'

  if (loading) {
    return null
  }

  if (!ad) {
    return null
  }

  return (
    <div className={className} onClick={handleAdClick}>
      <div dangerouslySetInnerHTML={{ __html: ad.content }} />
      
      {ad.css && (<style dangerouslySetInnerHTML={{ __html: ad.css }} />)}
      {ad.js && (<script dangerouslySetInnerHTML={{ __html: ad.js }} />)}
    </div>
  )
}
