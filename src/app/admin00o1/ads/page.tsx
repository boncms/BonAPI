'use client'

import { useState, useEffect } from 'react'
import { Ad } from '@/types'
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, BarChart3 } from 'lucide-react'

export default function AdsManagementPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadAds()
  }, [])

  const loadAds = async () => {
    try {
      const response = await fetch('/api/ads')
      const data = await response.json()
      // Ensure data is an array
      const adsArray = Array.isArray(data) ? data : []
      setAds(adsArray)
    } catch (error) {
      console.error('Error loading ads:', error)
      setAds([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return

    try {
      const response = await fetch(`/api/ads/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setAds(ads.filter(ad => ad.id !== id))
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
    }
  }

  const handleToggleActive = async (ad: Ad) => {
    try {
      const response = await fetch(`/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ad, isActive: !ad.isActive })
      })
      
      if (response.ok) {
        setAds(ads.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a))
      }
    } catch (error) {
      console.error('Error toggling ad:', error)
    }
  }

  const filteredAds = ads.filter(ad => {
    if (filter === 'active') return ad.isActive
    if (filter === 'inactive') return !ad.isActive
    return true
  })

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
            <h1 className="text-3xl font-bold text-white mb-2">Ads Management</h1>
            <p className="text-dark-300">Manage advertisements and sponsored content</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Ad
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Ads</p>
                <p className="text-2xl font-bold text-white">{ads.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-dark-300 text-sm">Active Ads</p>
                <p className="text-2xl font-bold text-white">{ads.filter(ad => ad.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <EyeOff className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-dark-300 text-sm">Inactive Ads</p>
                <p className="text-2xl font-bold text-white">{ads.filter(ad => !ad.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Impressions</p>
                <p className="text-2xl font-bold text-white">
                  {ads.reduce((sum, ad) => sum + ad.impressionCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            All Ads
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'inactive' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Ads Table */}
        <div className="bg-dark-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Impressions</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Clicks</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-dark-700 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{ad.title}</p>
                        {ad.description && (
                          <p className="text-dark-300 text-sm">{ad.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                        {ad.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          ad.isActive
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {ad.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {ad.impressionCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {ad.clickCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-dark-300">
                      {new Date(ad.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAd(ad)
                            setShowModal(true)
                          }}
                          className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
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

        {filteredAds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-300 text-lg">No ads found</p>
            <p className="text-dark-400 text-sm mt-2">
              {filter === 'all' 
                ? 'Create your first ad to get started'
                : `No ${filter} ads found`
              }
            </p>
          </div>
        )}
      </div>

      {/* Ad Modal */}
      {showModal && (
        <AdModal
          ad={editingAd}
          onClose={() => {
            setShowModal(false)
            setEditingAd(null)
          }}
          onSave={() => {
            loadAds()
            setShowModal(false)
            setEditingAd(null)
          }}
        />
      )}
    </div>
  )
}

// Ad Modal Component
function AdModal({ ad, onClose, onSave }: { ad: Ad | null, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    description: ad?.description || '',
    content: ad?.content || '',
    css: ad?.css || '',
    js: ad?.js || '',
    position: ad?.position || 'top',
    isActive: ad?.isActive ?? true,
    startDate: ad?.startDate || '',
    endDate: ad?.endDate || ''
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic client-side validation to avoid 400 from API
    if (!formData.title.trim() || !formData.content.trim() || !formData.position) {
      console.error('Validation failed: missing title/content/position')
      alert('Vui lòng nhập Title, HTML Content và chọn Position.')
      return
    }

    setSaving(true)

    try {
      const url = ad ? `/api/ads/${ad.id}` : '/api/ads'
      const method = ad ? 'PUT' : 'POST'

      const payload = { ...formData }
      // Optional trim to avoid accidental blanks
      payload.title = payload.title.trim()
      payload.content = payload.content.trim()

      console.debug('Submitting ad payload', payload)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSave()
      } else {
        const status = response.status
        const statusText = response.statusText
        let rawBody = ''
        try { rawBody = await response.text() } catch (_) { rawBody = '' }
        let parsed: any = null
        try { parsed = rawBody ? JSON.parse(rawBody) : null } catch (_) { parsed = null }
        console.error('Error saving ad', { status, statusText, rawBody, parsed })
        const message = parsed?.error || rawBody || 'Unknown error'
        alert(`Lưu quảng cáo thất bại (${status} ${statusText})${message ? `: ${message}` : ''}`)
      }
    } catch (error) {
      console.error('Error saving ad:', error)
      alert('Có lỗi khi lưu quảng cáo. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-2xl font-bold text-white">
            {ad ? 'Edit Ad' : 'Create New Ad'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: (e.target as HTMLSelectElement).value as any })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sidebar_1">Sidebar 1 (300x250)</option>
                <option value="sidebar_2">Sidebar 2 (300x250)</option>
                <option value="sidebar_3">Sidebar 3 (300x250)</option>
                <option value="homepage_ads_feature">Homepage Featured Banner (728x90)</option>
                <option value="homepage_ads_model">Homepage Models Banner (728x90)</option>
                <option value="top">Video Top (Sponsored)</option>
                <option value="inline">Video Inline (Advertisement)</option>
                <option value="bottom">Video Bottom (Recommended)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">HTML Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={6}
              placeholder="Enter HTML content for the ad..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Custom CSS</label>
            <textarea
              value={formData.css}
              onChange={(e) => setFormData({ ...formData, css: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Enter custom CSS styles..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Custom JavaScript</label>
            <textarea
              value={formData.js}
              onChange={(e) => setFormData({ ...formData, js: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Enter custom JavaScript code..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              />
              <span className="text-white">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : (ad ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
