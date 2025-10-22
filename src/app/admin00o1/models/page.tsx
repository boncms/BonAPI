'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Model } from '@/types'
import { Plus, Edit, Trash2, Search, X, Save } from 'lucide-react'
import Modal from '@/components/admin/Modal'

export default function ModelsManagementPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalModels, setTotalModels] = useState(0)
  const modelsPerPage = 50
  const [formData, setFormData] = useState<Partial<Model>>({
    name: '',
    description: '',
    avatar: '',
    videoCount: 0,
    totalViews: 0
  })

  // Modal states
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  })

  const loadModels = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * modelsPerPage
      const response = await fetch(`/api/models?limit=${modelsPerPage}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.models && Array.isArray(data.models)) {
        setModels(data.models)
        setTotalPages(data.totalPages || 1)
        setTotalModels(data.total || 0)
      } else {
        setModels([])
        setTotalPages(1)
        setTotalModels(0)
      }
    } catch (error) {
      console.error('Error loading models:', error)
      setModels([])
      setTotalPages(1)
      setTotalModels(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, modelsPerPage])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when searching
  }, [searchQuery])


  // No need for client-side filtering since we're doing it server-side
  const displayModels = models

  const handleAddNew = () => {
    setEditingModel(null)
    setFormData({
      name: '',
      description: '',
      avatar: '',
      videoCount: 0,
      totalViews: 0
    })
    setShowForm(true)
  }

  const handleEdit = (model: Model) => {
    setEditingModel(model)
    setFormData({
      ...model
    })
    setShowForm(true)
  }

  const handleDelete = async (modelId: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return
    
    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setModels(models.filter(m => m.id !== modelId))
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Model deleted successfully!',
          type: 'success'
        })
      } else {
        setModal({
          isOpen: true,
          title: 'Delete Failed',
          message: 'Failed to delete model',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      setModal({
        isOpen: true,
        title: 'Delete Failed',
        message: 'An error occurred while deleting the model',
        type: 'error'
      })
    }
  }

  const handleSave = async () => {
    try {
      const url = editingModel ? `/api/models/${editingModel.id}` : '/api/models'
      const method = editingModel ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const savedModel = await response.json()
        
        if (editingModel) {
          setModels(models.map(m => m.id === editingModel.id ? savedModel : m))
        } else {
          setModels([...models, savedModel])
        }
        
        setShowForm(false)
        setEditingModel(null)
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Model saved successfully!',
          type: 'success'
        })
      } else {
        setModal({
          isOpen: true,
          title: 'Save Failed',
          message: 'Failed to save model',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error saving model:', error)
      setModal({
        isOpen: true,
        title: 'Save Failed',
        message: 'An error occurred while saving the model',
        type: 'error'
      })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingModel(null)
    setFormData({
      name: '',
      description: '',
      avatar: '',
      videoCount: 0,
      totalViews: 0
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
            <h1 className="text-3xl font-bold text-white mb-2">Models Management</h1>
            <p className="text-dark-300">
              Manage model profiles and information ({totalModels.toLocaleString()} total models)
            </p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Model
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayModels.map((model) => (
            <div key={model.id} className="bg-dark-800 rounded-lg p-6 hover:bg-dark-700 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center">
                  {model.avatar ? (
                    <Image
                      src={model.avatar}
                      alt={model.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary-500">
                      {model.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                  <p className="text-dark-300 text-sm">{model.videoCount} videos</p>
                </div>
              </div>
              
              {model.description && (
                <p className="text-dark-300 text-sm mb-4 line-clamp-2">{model.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-dark-400">
                  {model.totalViews.toLocaleString()} total views
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(model)}
                    className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(model.id)}
                    className="p-2 text-dark-300 hover:text-red-400 hover:bg-dark-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayModels.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-dark-300 text-lg">No models found</p>
            <p className="text-dark-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first model to get started'}
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
        {totalModels > 0 && (
          <div className="text-center text-dark-400 text-sm mt-4">
            Showing {((currentPage - 1) * modelsPerPage) + 1} to {Math.min(currentPage * modelsPerPage, totalModels)} of {totalModels.toLocaleString()} models
          </div>
        )}

        {/* Model Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-dark-700">
                <h2 className="text-2xl font-bold text-white">
                  {editingModel ? 'Edit Model' : 'Add New Model'}
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
                    placeholder="Enter model name"
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
                    placeholder="Enter model description"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Avatar URL</label>
                  <input
                    type="url"
                    value={formData.avatar || ''}
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter avatar image URL"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Video Count</label>
                    <input
                      type="number"
                      value={formData.videoCount || 0}
                      onChange={(e) => setFormData({...formData, videoCount: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Total Views</label>
                    <input
                      type="number"
                      value={formData.totalViews || 0}
                      onChange={(e) => setFormData({...formData, totalViews: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
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
                  {editingModel ? 'Update Model' : 'Create Model'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={modal.isOpen}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </div>
    </div>
  )
}
