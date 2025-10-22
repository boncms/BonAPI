'use client'

import { useSettings } from '@/contexts/SettingsContext'

export default function Footer() {
  const { settings } = useSettings()
  const footerText = settings.footerText || `© 2025 ${settings.siteName || 'xCMS'}. All rights reserved.`
  
  return (
    <footer className="bg-dark-800 border-t border-dark-700 mt-12">
      <div className="container py-6">
        <div className="flex justify-center items-center gap-4">
          <p className="text-sm text-dark-400" dangerouslySetInnerHTML={{ __html: footerText }} />
        </div>
      </div>
    </footer>
  )
}
