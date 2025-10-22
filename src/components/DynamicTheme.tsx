'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { useEffect } from 'react'

export default function DynamicTheme() {
  const { settings } = useSettings()

  useEffect(() => {
    // Update CSS custom properties
    const root = document.documentElement
    
    if (settings.primaryColor) {
      const primary = settings.primaryColor
      root.style.setProperty('--primary-500', primary)
      root.style.setProperty('--primary-600', adjustColor(primary, -20))
      root.style.setProperty('--primary-700', adjustColor(primary, -40))
      root.style.setProperty('--primary-800', adjustColor(primary, -60))
      root.style.setProperty('--primary-900', adjustColor(primary, -80))
    } else {
      // Clear any previous values
      root.style.removeProperty('--primary-500')
      root.style.removeProperty('--primary-600')
      root.style.removeProperty('--primary-700')
      root.style.removeProperty('--primary-800')
      root.style.removeProperty('--primary-900')
    }
    
    if (settings.backgroundColor) {
      const bg = settings.backgroundColor
      root.style.setProperty('--dark-900', bg)
      root.style.setProperty('--dark-800', adjustColor(bg, 20))
      root.style.setProperty('--dark-700', adjustColor(bg, 40))
      root.style.setProperty('--dark-600', adjustColor(bg, 60))
    } else {
      root.style.removeProperty('--dark-900')
      root.style.removeProperty('--dark-800')
      root.style.removeProperty('--dark-700')
      root.style.removeProperty('--dark-600')
    }
    
    if (settings.textColor) {
      const text = settings.textColor
      root.style.setProperty('--white', text)
      root.style.setProperty('--dark-100', adjustColor(text, -10))
      root.style.setProperty('--dark-200', adjustColor(text, -20))
      root.style.setProperty('--dark-300', adjustColor(text, -30))
      root.style.setProperty('--dark-400', adjustColor(text, -50))
    } else {
      root.style.removeProperty('--white')
      root.style.removeProperty('--dark-100')
      root.style.removeProperty('--dark-200')
      root.style.removeProperty('--dark-300')
      root.style.removeProperty('--dark-400')
    }
    
    // Force re-render of elements using these colors
    if (settings.textColor) {
      document.body.style.setProperty('color', settings.textColor)
    }
    if (settings.backgroundColor) {
      document.body.style.setProperty('background-color', settings.backgroundColor)
    }
    
    // Force re-render by adding a class
    document.body.classList.add('theme-updated')
    setTimeout(() => {
      document.body.classList.remove('theme-updated')
    }, 100)
    
    // Trigger custom event for components to re-render
    window.dispatchEvent(new CustomEvent('themeUpdated', {
      detail: {
        primaryColor: settings.primaryColor,
        backgroundColor: settings.backgroundColor,
        textColor: settings.textColor
      }
    }))
    
    // Force re-render of all elements with primary colors
    const primaryElements = document.querySelectorAll('.bg-primary-600, .bg-primary-700, .text-primary-500, .border-primary-600')
    primaryElements.forEach(el => {
      const element = el as HTMLElement
      if (!settings.primaryColor) return
      if (element.classList.contains('bg-primary-600') || element.classList.contains('bg-primary-700')) {
        element.style.setProperty('background-color', settings.primaryColor, 'important')
      }
      if (element.classList.contains('text-primary-500')) {
        element.style.setProperty('color', settings.primaryColor, 'important')
      }
      if (element.classList.contains('border-primary-600')) {
        element.style.setProperty('border-color', settings.primaryColor, 'important')
      }
    })
    
    // Force re-render of all elements with dark colors
    const darkElements = document.querySelectorAll('.bg-dark-800, .bg-dark-700, .bg-dark-900')
    darkElements.forEach(el => {
      const element = el as HTMLElement
      if (!settings.backgroundColor) return
      if (element.classList.contains('bg-dark-900')) {
        element.style.setProperty('background-color', settings.backgroundColor, 'important')
      }
      if (element.classList.contains('bg-dark-800')) {
        element.style.setProperty('background-color', adjustColor(settings.backgroundColor, 20), 'important')
      }
      if (element.classList.contains('bg-dark-700')) {
        element.style.setProperty('background-color', adjustColor(settings.backgroundColor, 40), 'important')
      }
    })
    
    // Force re-render of all text elements
    const textElements = document.querySelectorAll('.text-white, .text-dark-300, .text-dark-400')
    textElements.forEach(el => {
      const element = el as HTMLElement
      if (!settings.textColor) return
      if (element.classList.contains('text-white')) {
        element.style.setProperty('color', settings.textColor, 'important')
      }
      if (element.classList.contains('text-dark-300')) {
        element.style.setProperty('color', adjustColor(settings.textColor, -30), 'important')
      }
      if (element.classList.contains('text-dark-400')) {
        element.style.setProperty('color', adjustColor(settings.textColor, -50), 'important')
      }
    })
  }, [settings.primaryColor, settings.backgroundColor, settings.textColor])

  return null
}

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