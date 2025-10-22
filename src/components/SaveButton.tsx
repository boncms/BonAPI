'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'

interface SavedLinkProps {
  className?: string
}

export default function SavedLink({ className = '' }: SavedLinkProps) {
  return (
    <Link
      href="/saved"
      className={`fixed bottom-20 right-6 z-40 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${className}`}
      aria-label="View saved videos"
      title="View saved videos"
    >
      <Heart className="w-6 h-6 fill-current" />
    </Link>
  )
}
