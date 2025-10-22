'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/types'
import { X } from 'lucide-react'

interface CategoryFormProps {
  category?: Category | null
  onSave: (category: Category) => void
  onCancel: () => void
}

export default function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      })
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newCategory: Category = {
      id: category?.id || Date.now(),
      name: formData.name,
      description: formData.description,
      videoCount: category?.videoCount || 0
    }

    onSave(newCategory)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onCancel}
            className="text-dark-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500 h-20 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors"
            >
              {category ? 'Update Category' : 'Add Category'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-dark-700 text-white py-2 rounded hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
