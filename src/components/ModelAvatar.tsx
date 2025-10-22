'use client'

import { useState, useEffect } from 'react'
import { Model } from '@/types'
import Image from 'next/image'

interface ModelAvatarProps {
  model: Model
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ModelAvatar({ model, size = 'md', className = '' }: ModelAvatarProps) {
  const [avatar, setAvatar] = useState(model.avatar)
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false)

  // Auto-fetch avatar from video if model doesn't have one
  useEffect(() => {
    const fetchAvatarFromVideo = async () => {
      if (model.avatar && model.avatar.trim() !== '') {
        return // Already has avatar
      }

      setIsLoadingAvatar(true)
      try {
        if (model.id && model.id > 0) {
          const response = await fetch(`/api/models/${model.id}/avatar`)
          const data = await response.json()
          if (data.success && data.avatar) {
            setAvatar(data.avatar)
            return
          }
        }
        // Fallback: query first video by model name
        const params = new URLSearchParams({ limit: '1', offset: '0', model: model.name })
        const vres = await fetch(`/api/videos?${params.toString()}`)
        const vdata = await vres.json()
        const first = vdata?.videos?.[0]
        if (first?.thumbnail) setAvatar(first.thumbnail)
      } catch (error) {
        console.error('Error fetching model avatar:', error)
      } finally {
        setIsLoadingAvatar(false)
      }
    }

    fetchAvatarFromVideo()
  }, [model.id, model.avatar, model.name])

  const sizeClasses = {
    sm: 'w-full h-full text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 text-lg'
  }

  return (
    <div className={`${sizeClasses[size]} bg-dark-700 rounded-lg flex items-center justify-center overflow-hidden relative ${className}`}>
      {avatar ? (
        <Image 
          src={avatar} 
          alt={model.name}
          fill
          className="object-cover"
          quality={100}
          unoptimized
          priority={false}
          sizes={size === 'sm' ? '40px' : size === 'md' ? '48px' : '96px'}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.parentElement?.querySelector('.fallback')
            if (fallback) {
              (fallback as HTMLElement).style.display = 'flex'
            }
          }}
        />
      ) : null}
      
      {/* Loading indicator */}
      {isLoadingAvatar && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      <div 
        className="fallback text-dark-400 w-full h-full flex items-center justify-center absolute inset-0"
        style={{ display: avatar ? 'none' : 'flex' }}
      >
        {model.name.charAt(0).toUpperCase()}
      </div>
    </div>
  )
}
