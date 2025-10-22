'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { useEffect } from 'react'

export default function DynamicMeta() {
  const { settings } = useSettings()

  useEffect(() => {
    // Update meta description
    if (settings.seoDescription) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', settings.seoDescription)
    }

    // Update meta keywords
    if (settings.seoKeywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', settings.seoKeywords)
    }

    // Update Open Graph tags
    if (settings.siteName) {
      let ogTitle = document.querySelector('meta[property="og:title"]')
      if (!ogTitle) {
        ogTitle = document.createElement('meta')
        ogTitle.setAttribute('property', 'og:title')
        document.head.appendChild(ogTitle)
      }
      ogTitle.setAttribute('content', settings.seoTitle || settings.siteName)

      let ogDescription = document.querySelector('meta[property="og:description"]')
      if (!ogDescription) {
        ogDescription = document.createElement('meta')
        ogDescription.setAttribute('property', 'og:description')
        document.head.appendChild(ogDescription)
      }
      ogDescription.setAttribute('content', settings.seoDescription || settings.siteDescription)
    }

    // Update Twitter Card tags
    let twitterCard = document.querySelector('meta[name="twitter:card"]')
    if (!twitterCard) {
      twitterCard = document.createElement('meta')
      twitterCard.setAttribute('name', 'twitter:card')
      twitterCard.setAttribute('content', 'summary_large_image')
      document.head.appendChild(twitterCard)
    }

    if (settings.siteName) {
      let twitterTitle = document.querySelector('meta[name="twitter:title"]')
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta')
        twitterTitle.setAttribute('name', 'twitter:title')
        document.head.appendChild(twitterTitle)
      }
      twitterTitle.setAttribute('content', settings.seoTitle || settings.siteName)

      let twitterDescription = document.querySelector('meta[name="twitter:description"]')
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta')
        twitterDescription.setAttribute('name', 'twitter:description')
        document.head.appendChild(twitterDescription)
      }
      twitterDescription.setAttribute('content', settings.seoDescription || settings.siteDescription)
    }

  }, [settings.seoTitle, settings.seoDescription, settings.seoKeywords, settings.siteName, settings.siteDescription])

  return null
}
