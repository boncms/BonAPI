'use client'

import { useState, useEffect } from 'react'
import { Model } from '@/types'
import { X } from 'lucide-react'

interface ModelFormProps {
  model?: Model | null
  onSave: (model: Model) => void
  onCancel: () => void
}

export default function ModelForm({ model, onSave, onCancel }: ModelFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: ''
  })

  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        description: model.description || '',
        avatar: model.avatar || ''
      })
    }
  }, [model])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newModel: Model = {
      id: model?.id || Date.now(),
      name: formData.name,
      description: formData.description,
      avatar: formData.avatar,
      videoCount: model?.videoCount || 0,
      totalViews: model?.totalViews || 0
    }

    onSave(newModel)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {model ? 'Edit Model' : 'Add New Model'}
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

          <div>
            <label className="block text-white text-sm font-medium mb-2">Avatar URL</label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors"
            >
              {model ? 'Update Model' : 'Add Model'}
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
