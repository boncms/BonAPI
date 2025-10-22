'use client'

import { useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'

export default function AdGlobalScripts() {
  const { settings } = useSettings()

  useEffect(() => {
    // Header script
    if (settings.adHeaderScript) {
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.defer = true
      s.innerHTML = settings.adHeaderScript
      document.head.appendChild(s)
      return () => { try { document.head.removeChild(s) } catch {}
      }
    }
  }, [settings.adHeaderScript])

  useEffect(() => {
    // Body script
    if (settings.adBodyScript) {
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.defer = true
      s.innerHTML = settings.adBodyScript
      document.body.appendChild(s)
      return () => { try { document.body.removeChild(s) } catch {} }
    }
  }, [settings.adBodyScript])

  useEffect(() => {
    // Footer script
    if (settings.adFooterScript) {
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.defer = true
      s.innerHTML = settings.adFooterScript
      document.body.appendChild(s)
      return () => { try { document.body.removeChild(s) } catch {} }
    }
  }, [settings.adFooterScript])

  return null
}


