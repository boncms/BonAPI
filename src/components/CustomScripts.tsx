'use client'

import { useEffect, useState } from 'react'

interface CustomScriptsProps {
  position?: 'header' | 'body' | 'footer'
}

export default function CustomScripts({ position }: CustomScriptsProps) {
  const [scripts, setScripts] = useState({
    headerScript: '',
    bodyScript: '',
    footerScript: ''
  })

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        setScripts({
          headerScript: data.headerScript || '',
          bodyScript: data.bodyScript || '',
          footerScript: data.footerScript || ''
        })
      } catch (error) {
        console.error('Error loading custom scripts:', error)
      }
    }

    loadScripts()

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadScripts()
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate)
  }, [])

  // Render specific script based on position
  if (position === 'header' && scripts.headerScript) {
    return <script dangerouslySetInnerHTML={{ __html: scripts.headerScript }} />
  }
  
  if (position === 'body' && scripts.bodyScript) {
    return <div dangerouslySetInnerHTML={{ __html: scripts.bodyScript }} />
  }
  
  if (position === 'footer' && scripts.footerScript) {
    return <div dangerouslySetInnerHTML={{ __html: scripts.footerScript }} />
  }

  // If no position specified, render all (for backward compatibility)
  if (!position) {
    return (
      <>
        {scripts.headerScript && (
          <script dangerouslySetInnerHTML={{ __html: scripts.headerScript }} />
        )}
        {scripts.bodyScript && (
          <div dangerouslySetInnerHTML={{ __html: scripts.bodyScript }} />
        )}
        {scripts.footerScript && (
          <div dangerouslySetInnerHTML={{ __html: scripts.footerScript }} />
        )}
      </>
    )
  }

  return null
}
