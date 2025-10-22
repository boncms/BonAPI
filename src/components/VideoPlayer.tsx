'use client'

import { useEffect, useRef, useState } from 'react'
import { Video } from '@/types'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'

interface VideoPlayerProps {
  video: Video
  onViewIncrement?: () => void
}

export default function VideoPlayer({ video, onViewIncrement }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine video type and URL
  const getVideoType = (url: string, urlType?: string) => {
    // Use videoUrlType from database if available
    if (urlType) {
      return urlType
    }
    
    if (!url) return 'embed'
    if (url.includes('.m3u8')) return 'hls'
    if (url.includes('.mp4')) return 'mp4'
    if (url.includes('embed') || url.includes('iframe') || url.includes('youtube') || url.includes('vimeo') || url.includes('player')) return 'embed'
    return 'embed' // default to embed for safety
  }

  const videoType = getVideoType(video.videoUrl, video.videoUrlType)

  useEffect(() => {
    // Skip setup for embed videos
    if (videoType === 'embed' || videoType === 'iframe') {
      setIsLoading(false)
      return
    }

    const videoElement = videoRef.current
    if (!videoElement) return
    
    // Double check: Don't setup video for embed
    if (videoType === 'embed') {
      return
    }

    const setupVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (videoType === 'hls') {
          // Load HLS.js dynamically
          const Hls = (await import('hls.js')).default
          
          if (Hls.isSupported()) {
            if (hlsRef.current) {
              hlsRef.current.destroy()
            }
            
            hlsRef.current = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            })
            
            hlsRef.current.loadSource(video.videoUrl)
            hlsRef.current.attachMedia(videoElement)
            
            hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false)
            })
            
            hlsRef.current.on(Hls.Events.ERROR, (event: any, data: any) => {
              // Only show error for fatal errors
              if (data.fatal) {
                setError('Failed to load video stream')
                setIsLoading(false)
              }
            })
          } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support
            videoElement.src = video.videoUrl
            setIsLoading(false)
          } else {
            setError('HLS not supported in this browser')
            setIsLoading(false)
          }
        } else if (videoType === 'mp4') {
          videoElement.src = video.videoUrl
          setIsLoading(false)
        } else if (videoType === 'embed') {
          // For embed videos, we'll show an iframe
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error setting up video:', err)
        setError('Failed to load video')
        setIsLoading(false)
      }
    }

    setupVideo()

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
      setIsLoading(false)
    }

    const handleError = (e: Event) => {
      setError('Failed to load video')
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      if (onViewIncrement) {
        onViewIncrement()
      }
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleAbort = () => {
      console.log('Video loading was aborted')
      setIsLoading(false)
    }

    const handleVolumeChange = () => {
      setVolume(videoElement.volume)
      setIsMuted(videoElement.muted)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('volumechange', handleVolumeChange)
    videoElement.addEventListener('ended', handleEnded)
    videoElement.addEventListener('error', handleError)
    videoElement.addEventListener('abort', handleAbort)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('volumechange', handleVolumeChange)
      videoElement.removeEventListener('ended', handleEnded)
      videoElement.removeEventListener('error', handleError)
      videoElement.removeEventListener('abort', handleAbort)
      
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [video.videoUrl, videoType, onViewIncrement])

  const togglePlay = async () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
    } else {
      try {
        await videoElement.play()
      } catch (error) {
        // Handle play() interruption gracefully
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Video play was interrupted')
        } else {
          console.error('Error playing video:', error)
        }
      }
    }
  }

  const toggleMute = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.muted = !videoElement.muted
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const newVolume = parseFloat(e.target.value)
    videoElement.volume = newVolume
    setVolume(newVolume)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const newTime = parseFloat(e.target.value)
    videoElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleFullscreen = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (!document.fullscreenElement) {
      videoElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const restart = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.currentTime = 0
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Handle embed videos
  if (videoType === 'embed') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={video.videoUrl}
          className="w-full h-full"
          allowFullScreen
          title={video.title}
        />
      </div>
    )
  }

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group video-player-container"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
      onTouchEnd={() => {
        // Hide controls after 3 seconds on mobile
        setTimeout(() => setShowControls(false), 3000)
      }}
    >
      {/* Video Element - Only render for non-embed videos */}
      {videoType !== 'embed' && videoType !== 'iframe' && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover relative z-10"
          poster={video.thumbnail}
          preload="metadata"
          playsInline
          webkit-playsinline="true"
        />
      )}
      
      {/* Fallback: If somehow video element is rendered for embed, hide it */}
      {videoType === 'embed' && (
        <div className="w-full h-full flex items-center justify-center text-white">
          <p>Loading embed video...</p>
        </div>
      )}
      

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <p className="text-lg font-bold mb-2">Video Error</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && !isLoading && !error && (
        <div className="video-player-overlay bg-gradient-to-t from-black/60 via-transparent to-transparent">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg truncate">{video.title}</h3>
            <div className="flex gap-2">
              <button
                onClick={restart}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="p-4 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors touch-manipulation min-h-[60px] min-w-[60px] flex items-center justify-center"
              style={{ touchAction: 'manipulation' }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-white text-sm">{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-3 text-white hover:bg-white/20 rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ touchAction: 'manipulation' }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-3 text-white hover:bg-white/20 rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ touchAction: 'manipulation' }}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white text-sm">
                  {video.views.toLocaleString()} views
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="p-3 text-white hover:bg-white/20 rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
