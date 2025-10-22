'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Video, Category, Model } from '@/types'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Wand2, ExternalLink, Play, Star } from 'lucide-react'
import VideoForm from '@/components/admin/VideoForm'
import VideoRewriteModal from '@/components/admin/VideoRewriteModal'
import { formatNumber } from '@/lib/utils'

export default function VideosManagementPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not-featured'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [rewriteVideo, setRewriteVideo] = useState<Video | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVideos, setTotalVideos] = useState(0)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const videosPerPage = 20

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * videosPerPage
      
      const [videosResponse, categoriesResponse, modelsResponse] = await Promise.all([
        fetch(`/api/admin/videos?limit=${videosPerPage}&offset=${offset}&search=${encodeURIComponent(debouncedSearch)}&featured=${featuredFilter}`),
        fetch('/api/categories?limit=1000&offset=0'),
        fetch('/api/models?limit=1000&offset=0') // Load all models for dropdown
      ])
      
      const videosData = await videosResponse.json()
      const categoriesData = await categoriesResponse.json()
      const modelsData = await modelsResponse.json()
      
      // Handle videos API response structure
      if (videosData.videos && Array.isArray(videosData.videos)) {
        setVideos(videosData.videos)
        setTotalPages(videosData.totalPages || 1)
        setTotalVideos(videosData.total || 0)
      } else {
        setVideos([])
        setTotalPages(1)
        setTotalVideos(0)
      }
      
      setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : (Array.isArray(categoriesData) ? categoriesData : []))
      setModels(Array.isArray(modelsData.models) ? modelsData.models : (Array.isArray(modelsData) ? modelsData : []))
    } catch (error) {
      console.error('Error loading data:', error)
      setVideos([])
      setTotalPages(1)
      setTotalVideos(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, videosPerPage, featuredFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounce search input and enforce min length
  useEffect(() => {
    const term = searchQuery.trim()
    const timer = setTimeout(() => {
      setDebouncedSearch(term.length >= 2 ? term : '')
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [featuredFilter])



  // No need for client-side filtering since we're doing it server-side
  const displayVideos = videos

  const handleAddNew = () => {
    setEditingVideo(null)
    setShowForm(true)
  }

  const handleEdit = (video: Video) => {
    setEditingVideo(video)
    setShowForm(true)
  }

  const handleDelete = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return
    
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setVideos(videos.filter(v => v.id !== videoId))
        showToast('Video deleted successfully!', 'success')
      } else {
        showToast('Failed to delete video', 'error')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      showToast('Error deleting video', 'error')
    }
  }

  const handleSave = async (videoData: Video) => {
    try {
      const url = editingVideo ? `/api/videos/${editingVideo.id}` : '/api/videos'
      const method = editingVideo ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoData)
      })
      
      if (response.ok) {
        const savedVideo = await response.json()
        
        if (editingVideo) {
          setVideos(videos.map(v => v.id === editingVideo.id ? savedVideo : v))
        } else {
          setVideos([...videos, savedVideo])
        }
        
        setShowForm(false)
        setEditingVideo(null)
        showToast('Video saved successfully!', 'success')
      } else {
        showToast('Failed to save video', 'error')
      }
    } catch (error) {
      console.error('Error saving video:', error)
      showToast('Error saving video', 'error')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingVideo(null)
  }

  const handleRewrite = (video: Video) => {
    setRewriteVideo(video)
  }

  const handleRewriteUpdate = (videoId: number, updates: { title?: string; description?: string }) => {
    setVideos(videos.map(v => 
      v.id === videoId 
        ? { ...v, ...updates }
        : v
    ))
  }

  const handleToggleFeatured = async (video: Video) => {
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...video,
          featured: !video.featured
        })
      })
      
      if (response.ok) {
        // Reload data from server to ensure consistency
        await loadData()
        
        // Clear homepage cache to refresh featured videos
        if (typeof window !== 'undefined') {
          // Clear client-side cache
          const cacheKeys = ['homepage:featured', 'homepage:videos']
          cacheKeys.forEach(key => {
            localStorage.removeItem(`cache_${key}`)
            sessionStorage.removeItem(`cache_${key}`)
          })
          
          // Force reload homepage data
          window.dispatchEvent(new CustomEvent('clearHomepageCache'))
        }
        
        showToast(`Video ${!video.featured ? 'featured' : 'unfeatured'} successfully!`, 'success')
      } else {
        showToast('Failed to update featured status', 'error')
      }
    } catch (error) {
      console.error('Error toggling featured status:', error)
      showToast('Error updating featured status', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Videos Management</h1>
            <p className="text-dark-300">
              Manage video content and metadata ({totalVideos.toLocaleString()} total videos)
            </p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Video
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {/* Featured Filter */}
          <div className="flex items-center gap-4">
            <label className="text-white font-medium">Filter by Featured:</label>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'featured' | 'not-featured')}
              className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Videos</option>
              <option value="featured">Featured Only</option>
              <option value="not-featured">Not Featured</option>
            </select>
            <button
              onClick={async () => {
                try {
                  // Clear client-side cache
                  if (typeof window !== 'undefined') {
                    localStorage.clear()
                    sessionStorage.clear()
                    
                    // Clear specific cache keys
                    const cacheKeys = [
                      'homepage:featured', 'homepage:videos', 'homepage:models', 
                      'homepage:categories', 'homepage:hot-weekly', 'homepage:most-viewed',
                      'videos:all', 'videos:featured', 'videos:public'
                    ]
                    cacheKeys.forEach(key => {
                      localStorage.removeItem(`cache_${key}`)
                      sessionStorage.removeItem(`cache_${key}`)
                    })
                    
                    // Force reload homepage data
                    window.dispatchEvent(new CustomEvent('clearHomepageCache'))
                    
                    // Reload current page data
                    await loadData()
                    
                    showToast('Cache cleared! Data reloaded.', 'success')
                  }
                } catch (error) {
                  console.error('Error clearing cache:', error)
                  showToast('Error clearing cache', 'error')
                }
              }}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Videos Table */}
        <div className="bg-dark-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Thumbnail</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Video URL</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Featured</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Views</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {displayVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-dark-700 transition-colors">
                    <td className="px-6 py-4">
                      <Image
                        src={video.thumbnail || '/no-thumbnail.webp'}
                        alt={video.title || 'Video'}
                        width={64}
                        height={48}
                        className="w-16 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{video.title || 'Untitled'}</p>
                        <p className="text-dark-300 text-sm line-clamp-2">{video.description || 'No description'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {video.videoUrl ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(video.videoUrl, '_blank')}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                              title={`Open video: ${video.videoUrl}`}
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            {video.videoUrlType && (
                              <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                {video.videoUrlType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-400 text-sm flex items-center gap-1">
                            <EyeOff className="w-4 h-4" />
                            No URL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{video.model || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                        {video.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        video.featured 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-dark-600 text-dark-300'
                      }`}>
                        {video.featured ? 'Featured' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{formatNumber(video.views || 0)}</td>
                    <td className="px-6 py-4 text-white">{video.duration || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(video)}
                          className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                          title="Edit video"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRewrite(video)}
                          className="p-2 text-dark-300 hover:text-purple-400 hover:bg-dark-600 rounded transition-colors"
                          title="Rewrite content with AI"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleFeatured(video)}
                          className={`p-2 hover:bg-dark-600 rounded transition-colors ${
                            video.featured 
                              ? 'text-yellow-400 hover:text-yellow-300' 
                              : 'text-dark-300 hover:text-yellow-400'
                          }`}
                          title={video.featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <Star className={`w-4 h-4 ${video.featured ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-dark-300 hover:text-red-400 hover:bg-dark-600 rounded transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {displayVideos.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-dark-300 text-lg">No videos found</p>
            <p className="text-dark-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first video to get started'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button 
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-dark-700 text-dark-300 rounded hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-dark-700 text-dark-300 rounded hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Page info */}
        {totalVideos > 0 && (
          <div className="text-center text-dark-400 text-sm mt-4">
            Showing {((currentPage - 1) * videosPerPage) + 1} to {Math.min(currentPage * videosPerPage, totalVideos)} of {totalVideos.toLocaleString()} videos
          </div>
        )}

        {/* Video Form Modal */}
        {showForm && (
          <VideoForm
            video={editingVideo}
            onSave={handleSave}
            onCancel={handleCancel}
            categories={categories}
            models={models}
          />
        )}

        {/* Video Rewrite Modal */}
        {rewriteVideo && (
          <VideoRewriteModal
            isOpen={!!rewriteVideo}
            onClose={() => setRewriteVideo(null)}
            video={rewriteVideo}
            onUpdate={handleRewriteUpdate}
          />
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              <div className="w-5 h-5">
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
