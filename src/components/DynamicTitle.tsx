'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { useEffect } from 'react'

export default function DynamicTitle() {
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.seoTitle) {
      document.title = settings.seoTitle
    } else if (settings.siteName) {
      document.title = settings.siteName
    }
  }, [settings.seoTitle, settings.siteName])

  return null
}