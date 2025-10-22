'use client'

import { useState, useEffect, useCallback } from 'react'
import { Category } from '@/types'
import { Plus, Edit, Trash2, Search, X, Save } from 'lucide-react'

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCategories, setTotalCategories] = useState(0)
  const categoriesPerPage = 20
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    videoCount: 0
  })

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * categoriesPerPage
      const response = await fetch(`/api/categories?limit=${categoriesPerPage}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories)
        setTotalPages(data.totalPages || 1)
        setTotalCategories(data.total || 0)
      } else if (Array.isArray(data)) {
        // Fallback for old API format
        setCategories(data)
        setTotalPages(1)
        setTotalCategories(data.length)
      } else {
        setCategories([])
        setTotalPages(1)
        setTotalCategories(0)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
      setTotalPages(1)
      setTotalCategories(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, categoriesPerPage])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when searching
  }, [searchQuery])


  // No need for client-side filtering since we're doing it server-side
  const displayCategories = categories

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      videoCount: 0
    })
    setShowForm(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      ...category
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setCategories(categories.filter(c => c.id !== categoryId))
        alert('Category deleted successfully!')
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const handleSave = async () => {
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const savedCategory = await response.json()
        
        if (editingCategory) {
          setCategories(categories.map(c => c.id === editingCategory.id ? savedCategory : c))
        } else {
          setCategories([...categories, savedCategory])
        }
        
        setShowForm(false)
        setEditingCategory(null)
        alert('Category saved successfully!')
      } else {
        alert('Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error saving category')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      videoCount: 0
    })
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
            <h1 className="text-3xl font-bold text-white mb-2">Categories Management</h1>
            <p className="text-dark-300">
              Manage content categories and organization ({totalCategories.toLocaleString()} total categories)
            </p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCategories.map((category) => (
            <div key={category.id} className="bg-dark-800 rounded-lg p-6 hover:bg-dark-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">
                  {category.videoCount} videos
                </span>
              </div>
              
              {category.description && (
                <p className="text-dark-300 text-sm mb-4">{category.description}</p>
              )}
              
              <div className="flex items-center justify-end gap-2">
                <button 
                  onClick={() => handleEdit(category)}
                  className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-dark-300 hover:text-red-400 hover:bg-dark-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {displayCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-dark-300 text-lg">No categories found</p>
            <p className="text-dark-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first category to get started'}
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
        {totalCategories > 0 && (
          <div className="text-center text-dark-400 text-sm mt-4">
            Showing {((currentPage - 1) * categoriesPerPage) + 1} to {Math.min(currentPage * categoriesPerPage, totalCategories)} of {totalCategories.toLocaleString()} categories
          </div>
        )}

        {/* Category Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-dark-700">
                <h2 className="text-2xl font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter category name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter category description"
                  />
                </div>

                {/* Video Count */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Video Count</label>
                  <input
                    type="number"
                    value={formData.videoCount || 0}
                    onChange={(e) => setFormData({...formData, videoCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 p-6 border-t border-dark-700">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
