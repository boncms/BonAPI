'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface CustomSection {
  id: number
  name: string
  category: string
  model: string
  display_count: number
  theme_card: string
  is_active: boolean
  sort_order: number
  icon?: string
  badge_text?: string
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
}

interface Model {
  id: number
  name: string
}

export default function CustomSectionsPage() {
  const [sections, setSections] = useState<CustomSection[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    model: '',
    display_count: 15,
    theme_card: 'premium',
    is_active: true,
    sort_order: 0,
    icon: '',
    badge_text: ''
  })

  const themeOptions = [
    { value: 'premium', label: 'Premium (Purple/Pink)', component: 'VideoCardPremium' },
    { value: 'theme1', label: 'Theme 1 (Blue/Purple)', component: 'VideoCardTheme1' },
    { value: 'theme2', label: 'Theme 2 (Green/Emerald)', component: 'VideoCardTheme2' },
    { value: 'theme3', label: 'Theme 3 (Red/Orange)', component: 'VideoCardTheme3' },
    { value: 'theme4', label: 'Theme 4 (Indigo/Cyan)', component: 'VideoCardTheme4' },
    { value: 'theme5', label: 'Theme 5 (Yellow/Amber)', component: 'VideoCardTheme5' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sectionsResponse, categoriesResponse, modelsResponse] = await Promise.all([
        fetch('/api/custom-sections'),
        fetch('/api/categories?limit=1000&offset=0'),
        fetch('/api/models?limit=1000&offset=0')
      ])
      
      const sectionsData = await sectionsResponse.json()
      const categoriesData = await categoriesResponse.json()
      const modelsData = await modelsResponse.json()
      
      setSections(sectionsData.sections || [])
      setCategories(categoriesData.categories || [])
      setModels(modelsData.models || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingSection(null)
    setFormData({
      name: '',
      category: '',
      model: '',
      display_count: 15,
      theme_card: 'premium',
      is_active: true,
      sort_order: 0,
      icon: '',
      badge_text: ''
    })
    setShowForm(true)
  }

  const handleEdit = (section: CustomSection) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      category: section.category,
      model: section.model,
      display_count: section.display_count,
      theme_card: section.theme_card,
      is_active: section.is_active,
      sort_order: section.sort_order,
      icon: section.icon || '',
      badge_text: section.badge_text || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return
    
    try {
      const response = await fetch(`/api/custom-sections/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSections(sections.filter(s => s.id !== id))
        alert('Section deleted successfully!')
      } else {
        alert('Failed to delete section')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Error deleting section')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSection ? `/api/custom-sections/${editingSection.id}` : '/api/custom-sections'
      const method = editingSection ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const savedSection = await response.json()
        
        if (editingSection) {
          setSections(sections.map(s => s.id === editingSection.id ? savedSection : s))
        } else {
          setSections([...sections, savedSection])
        }
        
        setShowForm(false)
        setEditingSection(null)
        alert('Section saved successfully!')
      } else {
        alert('Failed to save section')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error saving section')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSection(null)
  }

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const section = sections.find(s => s.id === id)
      if (!section) return
      
      const response = await fetch(`/api/custom-sections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...section,
          is_active: !currentStatus
        })
      })
      
      if (response.ok) {
        const updatedSection = await response.json()
        setSections(sections.map(s => s.id === id ? updatedSection : s))
      }
    } catch (error) {
      console.error('Error toggling section status:', error)
    }
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
            <h1 className="text-3xl font-bold text-white mb-2">Custom Sections</h1>
            <p className="text-dark-300">
              Manage custom video sections for homepage ({sections.length} sections)
            </p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Section
          </button>
        </div>

        {/* Sections Table */}
        <div className="bg-dark-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Icon</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Count</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Theme / Badge</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {sections.map((section) => (
                  <tr key={section.id} className="hover:bg-dark-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{section.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {section.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={section.icon} alt="icon" className="w-8 h-8 rounded" />
                      ) : (
                        <span className="text-dark-500 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                        {section.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{section.model || 'All Models'}</td>
                    <td className="px-6 py-4 text-white">{section.display_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                          {themeOptions.find(t => t.value === section.theme_card)?.label || section.theme_card}
                        </span>
                        {section.badge_text && (
                          <span className="px-2 py-1 bg-pink-600 text-white text-xs rounded-full">{section.badge_text}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(section.id, section.is_active)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          section.is_active 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {section.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {section.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(section)}
                          className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(section.id)}
                          className="p-2 text-dark-300 hover:text-red-400 hover:bg-dark-600 rounded transition-colors"
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

        {sections.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-dark-300 text-lg">No custom sections found</p>
            <p className="text-dark-400 text-sm mt-2">Add your first custom section to get started</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingSection ? 'Edit Section' : 'Add New Section'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-dark-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Model (Optional)
                    </label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Models</option>
                      {models.map(model => (
                        <option key={model.id} value={model.name}>{model.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Display Count */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Display Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.display_count}
                      onChange={(e) => setFormData({...formData, display_count: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Theme Card */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Theme Card
                    </label>
                    <select
                      value={formData.theme_card}
                      onChange={(e) => setFormData({...formData, theme_card: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {themeOptions.map(theme => (
                        <option key={theme.value} value={theme.value}>{theme.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Icon URL */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Icon URL (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-dark-400 mt-1">Displayed at w-8 h-8 in list.</p>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Badge Text */}
                  <div>
                    <label className="block text-dark-300 text-sm font-bold mb-2">
                      Badge Text (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Onlyfans, Hot, New"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({...formData, badge_text: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                  />
                  <label className="text-dark-300 text-sm font-bold">
                    Active Section
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-dark-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingSection ? 'Update' : 'Create'} Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
