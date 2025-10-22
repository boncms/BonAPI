'use client'

import { useSettings } from '@/contexts/SettingsContext'
import Image from 'next/image'
import { useEffect, useState } from 'react'

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const usePound = color[0] === '#'
  const col = usePound ? color.slice(1) : color
  
  const num = parseInt(col, 16)
  let r = (num >> 16) + amount
  let g = (num >> 8 & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount
  
  r = r > 255 ? 255 : r < 0 ? 0 : r
  g = g > 255 ? 255 : g < 0 ? 0 : g
  b = b > 255 ? 255 : b < 0 ? 0 : b
  
  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
}

export default function BeautifulLogo() {
  const { settings } = useSettings()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Use default values during SSR to prevent hydration mismatch
  const primaryColor = isClient ? settings.primaryColor : '#e69f05'
  const textColor = isClient ? settings.textColor : '#f8fafc'
  const siteName = isClient ? settings.siteName : ''
  const logoUrl = isClient ? settings.logoUrl : ''
  const seoDescription = isClient ? settings.seoDescription : ''
  const siteDescription = isClient ? settings.siteDescription : ''
  
  const subtitle = (seoDescription || siteDescription || '').trim()
  const showTextTitle = Boolean(siteName && siteName.trim() !== '' && siteName !== 'xCMS')
  const showSubtitle = Boolean(
    subtitle &&
    subtitle !== 'Professional Platform' &&
    subtitle !== 'Your video content management system'
  )


  // If logoUrl is provided, show image logo only
  if (logoUrl && logoUrl.trim() !== '') {
    // Ensure logo URL starts with / if it doesn't already have a protocol
    const finalLogoUrl = logoUrl.startsWith('http') ? logoUrl : `/${logoUrl}`
    
    return (
      <div className="flex items-center" onClick={() => (window.location.href = '/') }>
        {/* Logo Image - Full replacement */}
        <div className="h-12 cursor-pointer">
          <Image
            src={finalLogoUrl}
            alt={siteName || 'Logo'}
            width={200}
            height={48}
            className="h-full w-auto object-contain"
            quality={100}
            priority={true}
            unoptimized={true}
            style={{
              imageRendering: 'crisp-edges',
              WebkitBackfaceVisibility: 'hidden',
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)'
            }}
            onError={(e) => {
              // Fallback to text logo if image fails to load
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.parentElement?.parentElement?.querySelector('.fallback-logo')
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex'
              }
            }}
          />
        </div>

        {/* Fallback Text Logo (hidden by default) */}
        <div className="fallback-logo hidden items-center gap-3" style={{ display: 'none' }}>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3 group"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 50%, ${adjustColor(primaryColor, -40)} 100%)`,
              boxShadow: `0 8px 32px ${primaryColor}30, 0 0 0 1px ${primaryColor}20`
            }}
          >
            <span 
              className="text-white font-bold text-xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{
                textShadow: `0 0 20px ${primaryColor}60`
              }}
            >
              x
            </span>
          </div>
          {(showTextTitle || showSubtitle) && (
            <div>
              <h1 
                className="text-3xl font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ 
                  color: primaryColor,
                  textShadow: `0 0 20px ${primaryColor}40, 0 2px 4px rgba(0,0,0,0.3)`
                }}
              >
                {showTextTitle ? siteName : ''}
              </h1>
              {showSubtitle && (
                <p 
                  className="text-sm font-medium -mt-1 transition-all duration-300"
                  style={{
                    color: adjustColor(textColor || '#f8fafc', -20),
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default text logo if no logoUrl
  // If no siteName from DB, render nothing to avoid flashing placeholder "x"
  if (!siteName || siteName.trim() === '') {
    return null
  }

  return (
    <div className="flex items-center gap-3" onClick={() => (window.location.href = '/') }>
      {/* Logo Icon */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3 group"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 50%, ${adjustColor(primaryColor, -40)} 100%)`,
          boxShadow: `0 8px 32px ${primaryColor}30, 0 0 0 1px ${primaryColor}20`
        }}
      >
        <span 
          className="text-white font-bold text-xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          style={{
            textShadow: `0 0 20px ${primaryColor}60`
          }}
        >
          {siteName?.[0] || ''}
        </span>
      </div>
      
      {/* Logo Text */}
      {(showTextTitle || showSubtitle) && (
        <div>
          <h1 
            className="text-3xl font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ 
              color: primaryColor,
              textShadow: `0 0 20px ${primaryColor}40, 0 2px 4px rgba(0,0,0,0.3)`
            }}
          >
            {showTextTitle ? siteName : ''}
          </h1>
          {showSubtitle && (
            <p 
              className="text-sm font-medium -mt-1 transition-all duration-300"
              style={{
                color: adjustColor(textColor || '#f8fafc', -20),
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
