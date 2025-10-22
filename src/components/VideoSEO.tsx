'use client'

import { useEffect, useState } from 'react'
import { Video } from '@/types'

interface VideoSEOProps {
  video: Video
}

export default function VideoSEO({ video }: VideoSEOProps) {
  const [siteUrl, setSiteUrl] = useState('')
  
  useEffect(() => {
    // Load site URL from settings
    const loadSiteUrl = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSiteUrl(data.siteUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
        }
      } catch (error) {
        console.error('Error loading site URL:', error)
        setSiteUrl(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
      }
    }
    loadSiteUrl()
  }, [])

  const title = `${video.title} - xCMS`
  const description = video.description || `Watch ${video.title} by ${video.model} on xCMS`
  const image = video.thumbnail
  const url = `${siteUrl}/video/${video.slug}`

  useEffect(() => {
    // Update title
    document.title = title
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let meta = document.querySelector(selector) as HTMLMetaElement
      
      if (!meta) {
        meta = document.createElement('meta')
        if (property) {
          meta.setAttribute('property', name)
        } else {
          meta.setAttribute('name', name)
        }
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', content)
    }
    
    // Basic Meta Tags
    updateMetaTag('description', description)
    updateMetaTag('keywords', Array.isArray(video.tags) ? video.tags.join(', ') : video.category)
    updateMetaTag('author', video.model)
    updateMetaTag('robots', 'index, follow')
    
    // Open Graph / Facebook
    updateMetaTag('og:type', 'video.other', true)
    updateMetaTag('og:title', title, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:image', image || '', true)
    updateMetaTag('og:url', url, true)
    updateMetaTag('og:site_name', 'xCMS', true)
    updateMetaTag('og:video', video.videoUrl, true)
    updateMetaTag('og:video:type', 'video/mp4', true)
    updateMetaTag('og:video:width', '1920', true)
    updateMetaTag('og:video:height', '1080', true)
    
    // Twitter
    updateMetaTag('twitter:card', 'player')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', image || '')
    updateMetaTag('twitter:player', video.videoUrl)
    updateMetaTag('twitter:player:width', '1920')
    updateMetaTag('twitter:player:height', '1080')
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
    
    // Update theme color
    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!themeColor) {
      themeColor = document.createElement('meta')
      themeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(themeColor)
    }
    themeColor.setAttribute('content', '#1a1a1a')
    
    // Add structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title,
      "description": description,
      "thumbnailUrl": image,
      "uploadDate": video.uploadDate,
      "duration": video.duration,
      "contentUrl": video.videoUrl,
      "embedUrl": video.videoUrl,
      "author": {
        "@type": "Person",
        "name": video.model
      },
      "publisher": {
        "@type": "Organization",
        "name": "xCMS",
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/logo.png`
        }
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": video.views
      }
    }
    
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }
    
    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
    
  }, [video, title, description, image, url, siteUrl])

  return null
}