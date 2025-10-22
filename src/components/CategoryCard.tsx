'use client'

import { useRouter } from 'next/navigation'
import { Category } from '@/types'
import { Grid } from 'lucide-react'
import { createSlug } from '@/lib/utils'

interface CategoryCardProps {
  category: Category
  onClick?: () => void
}

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      const slug = createSlug(category.name)
      router.push(`/category/${slug}`)
    }
  }

  return (
    <div 
      className="card cursor-pointer hover:transform hover:scale-105 transition-all duration-300 text-center p-6"
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Grid className="w-6 h-6 text-dark-400" />
      </div>

      {/* Category Info */}
      <div>
        <h3 className="text-white text-base font-bold mb-2">
          {category.name}
        </h3>
        <div className="text-primary-400 text-sm">
          {category.videoCount} videos
        </div>
      </div>
    </div>
  )
}
