'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ArrowUp } from 'lucide-react'
import Image from 'next/image'

interface SavedLinkProps {
  className?: string
}

export default function SavedLink({ className = '' }: SavedLinkProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2 ${className}`}>
      {/* ThePornDude Logo */}
      <Link
        href="https://theporndude.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Visit ThePornDude"
        title="Visit ThePornDude"
      >
        <Image
          src="/icons/theporndude_logo.webp"
          alt="ThePornDude"
          width={32}
          height={32}
          className="w-8 h-8"
        />
      </Link>
      
      {/* Saved Videos Heart */}
      <Link
        href="/saved"
        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="View saved videos"
        title="View saved videos"
      >
        <Heart className="w-6 h-6 fill-current" />
      </Link>
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}

// Internal ScrollToTop component for SavedLink
function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  )
}
