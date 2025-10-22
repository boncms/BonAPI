'use client'

import { useState, useEffect } from 'react'
import { Heart, ThumbsUp, ThumbsDown, Share2, ArrowUp } from 'lucide-react'

interface VideoActionsProps {
  videoId: number
  initialLikes: number
  initialDislikes: number
  onLike?: (likes: number) => void
  onDislike?: (dislikes: number) => void
  onShare?: () => void
  onSave?: () => void
  onScrollToTop?: () => void
}

export default function VideoActions({
  videoId,
  initialLikes,
  initialDislikes,
  onLike,
  onDislike,
  onShare,
  onSave,
  onScrollToTop
}: VideoActionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleLike = async () => {
    if (isLiked) return
    
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const newLikes = likes + 1
        setLikes(newLikes)
        setIsLiked(true)
        setIsDisliked(false)
        setDislikes(Math.max(0, dislikes - 1))
        onLike?.(newLikes)
      }
    } catch (error) {
      console.error('Error liking video:', error)
    }
  }

  const handleDislike = async () => {
    if (isDisliked) return
    
    try {
      const response = await fetch(`/api/videos/${videoId}/dislike`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const newDislikes = dislikes + 1
        setDislikes(newDislikes)
        setIsDisliked(true)
        setIsLiked(false)
        setLikes(Math.max(0, likes - 1))
        onDislike?.(newDislikes)
      }
    } catch (error) {
      console.error('Error disliking video:', error)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      onShare?.()
    }
  }

  const handleSave = () => {
    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]')
    
    if (isSaved) {
      // Remove from saved
      const updatedSaved = savedVideos.filter((id: number) => id !== videoId)
      localStorage.setItem('savedVideos', JSON.stringify(updatedSaved))
      setIsSaved(false)
    } else {
      // Add to saved
      savedVideos.push(videoId)
      localStorage.setItem('savedVideos', JSON.stringify(savedVideos))
      setIsSaved(true)
    }
    
    onSave?.()
  }


  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    onScrollToTop?.()
  }

  // Check if video is saved on component mount
  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]')
    setIsSaved(savedVideos.includes(videoId))
  }, [videoId])


  return (
    <div className="flex items-center gap-4">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLiked}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          isLiked 
            ? 'bg-green-600 text-white' 
            : 'bg-dark-700 hover:bg-primary-600 hover:text-white text-white'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{likes}</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={handleDislike}
        disabled={isDisliked}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          isDisliked 
            ? 'bg-red-600 text-white' 
            : 'bg-dark-700 hover:bg-primary-600 hover:text-white text-white'
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{dislikes}</span>
      </button>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          isSaved 
            ? 'bg-red-500 text-white' 
            : 'bg-dark-700 hover:bg-primary-600 hover:text-white text-white'
        }`}
      >
        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        <span>{isSaved ? 'Saved' : 'Save'}</span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-primary-600 hover:text-white text-white transition-all duration-300"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {/* Scroll to Top Button removed as requested */}
    </div>
  )
}
