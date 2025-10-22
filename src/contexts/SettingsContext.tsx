'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Settings {
  siteName: string
  siteDescription: string
  siteUrl: string
  adminPassword: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  logoUrl: string
  faviconUrl: string
  footerText: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  adHeaderScript?: string
  adBodyScript?: string
  adFooterScript?: string
  // Homepage display counts
  homepageFeaturedPerPage?: number
  homepageOnlyfansCount?: number
  homepageHotWeeklyCount?: number
  homepageModelsCount?: number
  homepageCrazyCategoriesCount?: number
}

interface SettingsContextType {
  settings: Settings
  loading: boolean
  updateSettings: (newSettings: Partial<Settings>) => void
  refreshSettings: () => Promise<void>
}

const defaultSettings: Settings = {
  siteName: '',
  siteDescription: '',
  siteUrl: '',
  adminPassword: '',
  primaryColor: '',
  backgroundColor: '',
  textColor: '',
  logoUrl: '',
  faviconUrl: '',
  footerText: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  adHeaderScript: '',
  adBodyScript: '',
  adFooterScript: '',
  homepageFeaturedPerPage: 30,
  homepageOnlyfansCount: 15,
  homepageHotWeeklyCount: 15,
  homepageModelsCount: 12,
  homepageCrazyCategoriesCount: 12
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children, initialSettings }: { children: ReactNode; initialSettings?: Partial<Settings> }) {
  const [settings, setSettings] = useState<Settings>({ ...defaultSettings, ...(initialSettings || {}) })
  const [loading, setLoading] = useState(!initialSettings)

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/settings?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const refreshSettings = async () => {
    setLoading(true)
    await loadSettings()
  }

  useEffect(() => {
    // If initial settings were provided (from server), skip immediate flash
    // and still refresh from API in the background for freshness
    if (!initialSettings) {
      loadSettings()
    } else {
      // Refresh in background without toggling loading UI
      loadSettings()
    }

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadSettings()
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}