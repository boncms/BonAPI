'use client'

import { useRouter } from 'next/navigation'
import { Model } from '@/types'
import { formatNumber, createSlug } from '@/lib/utils'
import { Eye, Video as VideoIcon } from 'lucide-react'
import ModelAvatar from './ModelAvatar'

interface ModelCardProps {
  model: Model
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function ModelCard({ model, onClick, size = 'md' }: ModelCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      const slug = createSlug(model.name)
      router.push(`/model/${slug}`)
    }
  }

  return (
    <div 
      className="card cursor-pointer hover:transform hover:scale-105 transition-all duration-300 text-center"
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className={`${size === 'sm' ? 'mb-2 aspect-square' : 'aspect-square mb-3'}`}>
        <ModelAvatar model={model} size={size} className="w-full h-full" />
      </div>

      {/* Model Info */}
      <div className={`${size === 'sm' ? 'p-2' : 'p-3'}`}>
        <h3 className={`text-white font-bold ${size === 'sm' ? 'mb-1 text-xs' : 'mb-2 text-sm'}`}>
          {model.name}
        </h3>
        <div className={`flex justify-center gap-4 items-center text-dark-400 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
          <span className="inline-flex items-center gap-1">
            <VideoIcon className="w-3.5 h-3.5 text-primary-500" />
            {model.videoCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-primary-500" />
            {formatNumber(model.totalViews)}
          </span>
        </div>
      </div>
    </div>
  )
}
