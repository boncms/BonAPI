'use client'

import { useState, useEffect } from 'react'
import { Filter, X, Search, Calendar, User, Tag } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import dbService from '@/lib/database-client'

interface FilterOptions {
  categories: string[]
  models: string[]
  sortBy: 'newest' | 'oldest' | 'most_viewed' | 'most_liked'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
}

export default function VideoFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<FilterOptions>({
    categories: [],
    models: [],
    sortBy: 'newest',
    dateRange: 'all'
  })
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // Load filter options from URL params
  useEffect(() => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const models = searchParams.get('models')?.split(',').filter(Boolean) || []
    const sortBy = (searchParams.get('sortBy') as FilterOptions['sortBy']) || 'newest'
    const dateRange = (searchParams.get('dateRange') as FilterOptions['dateRange']) || 'all'

    setOptions({ categories, models, sortBy, dateRange })
  }, [searchParams])

  // Load available filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true)
        const [categories, models] = await Promise.all([
          dbService.getCategories(),
          dbService.getModels()
        ])
        
        setAvailableCategories(categories.map(c => c.name))
        setAvailableModels(models.map(m => m.name))
      } catch (error) {
        console.error('Error loading filter options:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilterOptions()
  }, [])

  const updateFilters = (newOptions: Partial<FilterOptions>) => {
    const updatedOptions = { ...options, ...newOptions }
    setOptions(updatedOptions)

    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    
    if (updatedOptions.categories.length > 0) {
      params.set('categories', updatedOptions.categories.join(','))
    } else {
      params.delete('categories')
    }

    if (updatedOptions.models.length > 0) {
      params.set('models', updatedOptions.models.join(','))
    } else {
      params.delete('models')
    }

    if (updatedOptions.sortBy !== 'newest') {
      params.set('sortBy', updatedOptions.sortBy)
    } else {
      params.delete('sortBy')
    }

    if (updatedOptions.dateRange !== 'all') {
      params.set('dateRange', updatedOptions.dateRange)
    } else {
      params.delete('dateRange')
    }

    // Reset to page 1 when filters change
    params.delete('page')

    router.push(`/videos?${params.toString()}`)
  }

  const toggleCategory = (category: string) => {
    const newCategories = options.categories.includes(category)
      ? options.categories.filter(c => c !== category)
      : [...options.categories, category]
    updateFilters({ categories: newCategories })
  }

  const toggleModel = (model: string) => {
    const newModels = options.models.includes(model)
      ? options.models.filter(m => m !== model)
      : [...options.models, model]
    updateFilters({ models: newModels })
  }

  const clearAllFilters = () => {
    setOptions({
      categories: [],
      models: [],
      sortBy: 'newest',
      dateRange: 'all'
    })
    router.push('/videos')
  }

  const hasActiveFilters = options.categories.length > 0 || 
                          options.models.length > 0 || 
                          options.sortBy !== 'newest' || 
                          options.dateRange !== 'all'

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
              {options.categories.length + options.models.length + 
               (options.sortBy !== 'newest' ? 1 : 0) + 
               (options.dateRange !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-dark-800 rounded-lg p-6 space-y-6">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Sort By
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'most_viewed', label: 'Most Viewed' },
                { value: 'most_liked', label: 'Most Liked' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ sortBy: option.value as FilterOptions['sortBy'] })}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    options.sortBy === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'year', label: 'This Year' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ dateRange: option.value as FilterOptions['dateRange'] })}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    options.dateRange === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categories
            </label>
            {loading ? (
              <div className="text-gray-400">Loading categories...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      options.categories.includes(category)
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Models */}
          <div>
            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Models
            </label>
            {loading ? (
              <div className="text-gray-400">Loading models...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableModels.slice(0, 20).map((model) => (
                  <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      options.models.includes(model)
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    {model}
                  </button>
                ))}
                {availableModels.length > 20 && (
                  <span className="text-gray-400 text-sm px-3 py-2">
                    +{availableModels.length - 20} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
