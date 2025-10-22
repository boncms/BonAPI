'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopProps {
  threshold?: number
  className?: string
}

export default function ScrollToTop({ threshold = 300, className = '' }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  // This component is now integrated into SavedLink
  // Return null to prevent duplicate buttons
  return null
}
