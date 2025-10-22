'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Video, Category, Model } from '@/types'
import { X, Search, Plus } from 'lucide-react'
import { createSlug } from '@/lib/utils'

interface VideoFormProps {
  video?: Video | null
  onSave: (video: Video) => void
  onCancel: () => void
  categories: Category[]
  models: Model[]
}

export default function VideoForm({ video, onSave, onCancel, categories, models }: VideoFormProps) {
  const [formData, setFormData] = useState<Partial<Video>>({
    title: '',
    description: '',
    duration: '',
    featured: false,
    thumbnail: '',
    videoUrl: '',
    videoUrlType: 'embed', // New field for URL type
    category: '',
    model: '',
    views: 0,
    likes: 0,
    dislikes: 0,
    uploadDate: new Date().toISOString().split('T')[0],
    tags: [],
    slug: '' // New field for slug
  })

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])

  const [categorySearch, setCategorySearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [tagInput, setTagInput] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (video) {
      setFormData({
        ...video,
        title: video.title || '',
        description: video.description || '',
        duration: video.duration || '',
        featured: Boolean(video.featured),
        thumbnail: video.thumbnail || '',
        videoUrl: video.videoUrl || '',
        category: video.category || '',
        model: video.model || '',
        views: video.views || 0,
        likes: video.likes || 0,
        dislikes: video.dislikes || 0,
        uploadDate: video.uploadDate ? new Date(video.uploadDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        tags: video.tags || [],
        videoUrlType: video.videoUrl?.includes('m3u8') ? 'm3u8' : 'embed',
        slug: video.slug || createSlug(video.title)
      })
      
      // Initialize selected categories and models
      setSelectedCategories(video.category ? video.category.split(',').map(c => c.trim()).filter(c => c) : [])
      setSelectedModels(video.model ? video.model.split(',').map(m => m.trim()).filter(m => m) : [])
    }
  }, [video])

  // Auto-generate slug when title changes
  useEffect(() => {
    if (formData.title) {
      const autoSlug = createSlug(formData.title)
      setFormData(prev => ({ ...prev, slug: autoSlug }))
    }
  }, [formData.title])

  // Filter categories based on search
  useEffect(() => {
    if (categorySearch) {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories(categories)
    }
  }, [categorySearch, categories])

  // Filter models based on search
  useEffect(() => {
    if (modelSearch) {
      const filtered = models.filter(model =>
        model.name.toLowerCase().includes(modelSearch.toLowerCase())
      )
      setFilteredModels(filtered)
    } else {
      setFilteredModels(models)
    }
  }, [modelSearch, models])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false)
        setShowModelDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }


  const handleCreateCategory = async () => {
    if (categorySearch.trim()) {
      const categoryName = categorySearch.trim()
      
      // Check if already selected
      if (selectedCategories.includes(categoryName)) {
        setCategorySearch('')
        return
      }
      
      try {
        const newCategory = {
          name: categoryName,
          description: '',
          videoCount: 0
        }
        
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newCategory)
        })
        
        if (response.ok) {
          const category = await response.json()
          setSelectedCategories(prev => [...prev, category.name])
          setShowCategoryDropdown(false)
          setCategorySearch('')
          
        } else {
          const errorData = await response.json()
          console.error('Failed to create category:', errorData.error || 'Unknown error')
          alert(`Failed to create category: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error creating category:', error)
      }
    }
  }

  const handleCreateModel = async () => {
    if (modelSearch.trim()) {
      const modelName = modelSearch.trim()
      
      // Check if already selected
      if (selectedModels.includes(modelName)) {
        setModelSearch('')
        return
      }
      
      try {
        const newModel = {
          name: modelName,
          description: '',
          avatar: '',
          videoCount: 0,
          totalViews: 0
        }
        
        const response = await fetch('/api/models', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newModel)
        })
        
        if (response.ok) {
          const model = await response.json()
          setSelectedModels(prev => [...prev, model.name])
          setShowModelDropdown(false)
          setModelSearch('')
        } else {
          const errorData = await response.json()
          console.error('Failed to create model:', errorData.error || 'Unknown error')
          alert(`Failed to create model: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error creating model:', error)
      }
    }
  }

  const handleCategorySelect = (categoryName: string) => {
    if (!selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev => [...prev, categoryName])
    }
    setCategorySearch('')
    setShowCategoryDropdown(false)
  }

  const handleModelSelect = (modelName: string) => {
    if (!selectedModels.includes(modelName)) {
      setSelectedModels(prev => [...prev, modelName])
    }
    setModelSearch('')
    setShowModelDropdown(false)
  }

  const removeCategory = (categoryName: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== categoryName))
  }

  const removeModel = (modelName: string) => {
    setSelectedModels(prev => prev.filter(m => m !== modelName))
  }

  const uploadOneFile = async (file: File): Promise<{ url?: string; errorMsg?: string }> => {
    // Single direct call, preserveFormat=0, no retries or re-encode
    const fd = new FormData()
    fd.append('files', file, file.name)
    fd.append('preserveFormat', '0')
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: fd
    })
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = { raw: text } }
    const url = data?.results?.[0]?.url
    if (res.ok && url) return { url }
    const baseError = data?.errors?.[0]?.error || data?.error || data?.message || data?.raw || 'Upload failed'
    return { errorMsg: String(baseError) }
  }

  const handleThumbnailFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError('')
    setUploadingThumb(true)
    try {
      const firstFile = files[0]
      // Validate against imgup.space rules
      const maxBytes = 15 * 1024 * 1024
      const allowedTypes = ['image/png', 'image/jpeg']
      if (firstFile.size > maxBytes) {
        throw new Error('PNG/JPG ≤ 15MB. File của bạn vượt quá 15MB.')
      }
      if (!allowedTypes.includes(firstFile.type)) {
        throw new Error('Chỉ hỗ trợ PNG/JPG. Vui lòng chọn đúng định dạng.')
      }
      const { url, errorMsg } = await uploadOneFile(firstFile)
      if (!url) throw new Error(errorMsg || 'Upload failed')
      setFormData(prev => ({ ...prev, thumbnail: url }))
    } catch (err: any) {
      console.error('Thumbnail upload error:', err)
      setUploadError(err?.message || 'Upload error')
    } finally {
      setUploadingThumb(false)
    }
  }

  const generateRandomStats = () => {
    const views = Math.floor(Math.random() * 100000) + 1000
    const likes = Math.floor(Math.random() * 5000) + 100
    const dislikes = Math.floor(Math.random() * 200) + 1 // Ít dislike hơn
    setFormData(prev => ({
      ...prev,
      views,
      likes,
      dislikes
    }))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (tagInput.trim()) {
        const newTags = [...(formData.tags || []), tagInput.trim()]
        setFormData(prev => ({ ...prev, tags: newTags }))
        setTagInput('')
      }
    }
  }

  const removeTag = (index: number) => {
    const newTags = formData.tags?.filter((_, i) => i !== index) || []
    setFormData(prev => ({ ...prev, tags: newTags }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title || !formData.duration || !formData.videoUrl || selectedCategories.length === 0 || selectedModels.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    // Prepare video data
    const videoData: Video = {
      id: video?.id || 0,
      title: formData.title!,
      description: formData.description || '',
      duration: formData.duration!,
      thumbnail: formData.thumbnail || '',
      videoUrl: formData.videoUrl!,
      category: selectedCategories.join(', '),
      model: selectedModels.join(', '),
      views: formData.views || 0,
      likes: formData.likes || 0,
      dislikes: formData.dislikes || 0,
      uploadDate: formData.uploadDate!,
      tags: formData.tags || [],
      featured: formData.featured || false,
      slug: formData.slug || createSlug(formData.title!)
    }

    onSave(videoData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {video ? 'Edit Video' : 'Add New Video'}
          </h2>
          <button
            onClick={onCancel}
            className="text-dark-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Auto-generated from title"
            />
            <p className="text-xs text-dark-400 mt-1">
              URL-friendly version of the title. Auto-generated but editable.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Duration *
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="MM:SS"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Video URL Type */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Video URL Type
            </label>
            <select
              name="videoUrlType"
              value={formData.videoUrlType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="embed">Embed iframe</option>
              <option value="m3u8">M3U8 Stream</option>
              <option value="mp4">MP4 Video</option>
            </select>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Video URL *
            </label>
            <input
              type="text"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleInputChange}
              placeholder={
                formData.videoUrlType === 'embed' ? 'https://example.com/embed/...' :
                formData.videoUrlType === 'm3u8' ? 'https://example.com/playlist.m3u8' :
                'https://example.com/video.mp4'
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Categories with Live Search */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Categories *
            </label>
            
            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-full text-sm"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      className="hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <div className="relative dropdown-container">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value)
                      setShowCategoryDropdown(true)
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateCategory()
                      }
                    }}
                    placeholder="Search or create category..."
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-dark-700 border border-dark-600 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                      {filteredCategories.length === 0 ? (
                        <div className="px-3 py-2 text-dark-400 text-sm">
                          No categories available
                        </div>
                      ) : (
                        filteredCategories
                          .filter(cat => !selectedCategories.includes(cat.name))
                          .map((category) => (
                          <div
                            key={category.id}
                            onClick={() => handleCategorySelect(category.name)}
                            className="px-3 py-2 hover:bg-dark-600 cursor-pointer text-white"
                          >
                            {category.name}
                          </div>
                        ))
                      )}
                      {categorySearch && !filteredCategories.some(cat => cat.name.toLowerCase() === categorySearch.toLowerCase()) && (
                        <div
                          onClick={handleCreateCategory}
                          className="px-3 py-2 hover:bg-dark-600 cursor-pointer text-primary-400 border-t border-dark-600 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create &quot;{categorySearch}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Models with Live Search */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Models *
            </label>
            
            {/* Selected Models */}
            {selectedModels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedModels.map((model) => (
                  <span
                    key={model}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-sm"
                  >
                    {model}
                    <button
                      type="button"
                      onClick={() => removeModel(model)}
                      className="hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <div className="relative dropdown-container">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value)
                      setShowModelDropdown(true)
                    }}
                    onFocus={() => setShowModelDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateModel()
                      }
                    }}
                    placeholder="Search or create model..."
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                  
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-dark-700 border border-dark-600 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                      {filteredModels
                        .filter(model => !selectedModels.includes(model.name))
                        .map((model) => (
                        <div
                          key={model.id}
                          onClick={() => handleModelSelect(model.name)}
                          className="px-3 py-2 hover:bg-dark-600 cursor-pointer text-white"
                        >
                          {model.name}
                        </div>
                      ))}
                      {modelSearch && !filteredModels.some(model => model.name.toLowerCase() === modelSearch.toLowerCase()) && (
                        <div
                          onClick={handleCreateModel}
                          className="px-3 py-2 hover:bg-dark-600 cursor-pointer text-primary-400 border-t border-dark-600 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create &quot;{modelSearch}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Thumbnail
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 mb-3 ${uploadingThumb ? 'border-primary-500' : 'border-dark-600'} bg-dark-700 text-dark-300`}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={(e) => { e.preventDefault(); handleThumbnailFiles(e.dataTransfer.files) }}
            >
              <p className="mb-2">Upload thumbnail</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailFiles(e.target.files)}
                className="block w-full text-sm text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
              />
              {uploadingThumb && (
                <p className="text-primary-400 mt-2">Đang upload...</p>
              )}
              {uploadError && (
                <p className="text-red-400 mt-2">{uploadError}</p>
              )}
            </div>
            <input
              type="text"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleInputChange}
              placeholder="https://example.com/thumb.jpg"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {formData.thumbnail && (
              <div className="mt-3">
                <Image src={formData.thumbnail} alt="thumbnail preview" width={320} height={160} className="max-h-40 rounded" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="lg:col-span-2">
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Type tag and press Enter to add..."
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {formData.tags && Array.isArray(formData.tags) && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-sm rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-white hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Statistics</h3>
              <button
                type="button"
                onClick={generateRandomStats}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                🎲 Generate Random
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-dark-300 text-sm font-bold mb-2">
                  Views
                </label>
                <input
                  type="number"
                  name="views"
                  value={formData.views}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm font-bold mb-2">
                  Likes
                </label>
                <input
                  type="number"
                  name="likes"
                  value={formData.likes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm font-bold mb-2">
                  Dislikes
                </label>
                <input
                  type="number"
                  name="dislikes"
                  value={formData.dislikes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Upload Date */}
          <div>
            <label className="block text-dark-300 text-sm font-bold mb-2">
              Upload Date
            </label>
            <input
              type="date"
              name="uploadDate"
              value={formData.uploadDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
            />
            <label className="text-dark-300 text-sm font-bold">
              Featured Video
            </label>
          </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {video ? 'Update' : 'Create'} Video
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}