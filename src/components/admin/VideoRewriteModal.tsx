'use client'

import { useState } from 'react'
import { X, Wand2, Save, RotateCcw, Loader2 } from 'lucide-react'

interface VideoRewriteModalProps {
  isOpen: boolean
  onClose: () => void
  video: {
    id: number
    title: string
    description?: string
    model: string
    category: string
    duration: string
    views: number
  }
  onUpdate: (videoId: number, updates: { title?: string; description?: string }) => void
}

export default function VideoRewriteModal({ 
  isOpen, 
  onClose, 
  video, 
  onUpdate 
}: VideoRewriteModalProps) {
  const [rewriteType, setRewriteType] = useState<'title' | 'description' | 'both'>('both')
  const [style, setStyle] = useState<'seo' | 'engaging' | 'professional' | 'casual'>('seo')
  const [language, setLanguage] = useState<'en' | 'vi' | 'auto'>('auto')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{
    newTitle?: string
    newDescription?: string
    original?: {
      title: string
      description: string
    }
  } | null>(null)

  if (!isOpen) return null

  const handleRewrite = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch(`/api/videos/${video.id}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: rewriteType,
          style,
          language,
          customPrompt: customPrompt || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to rewrite content')
      }

      setResult(data.data)
    } catch (error) {
      console.error('Error rewriting content:', error)
      alert('Failed to rewrite content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result) return

    setSaving(true)
    try {
      const updates: { title?: string; description?: string } = {}
      if (result.newTitle) updates.title = result.newTitle
      if (result.newDescription) updates.description = result.newDescription

      const response = await fetch(`/api/videos/${video.id}/update-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update content')
      }

      onUpdate(video.id, updates)
      onClose()
      setResult(null)
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Failed to save content. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setCustomPrompt('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Rewrite Video Content
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Original Content */}
          <div className="bg-dark-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Original Content</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Title</label>
                <p className="text-white bg-dark-600 p-2 rounded text-sm">
                  {video.title}
                </p>
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Description</label>
                <p className="text-white bg-dark-600 p-2 rounded text-sm max-h-32 overflow-y-auto">
                  {video.description || 'No description available'}
                </p>
              </div>
            </div>
          </div>

          {/* Rewrite Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">Rewrite Type</label>
              <select
                value={rewriteType}
                onChange={(e) => setRewriteType(e.target.value as any)}
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
              >
                <option value="title">Title Only</option>
                <option value="description">Description Only</option>
                <option value="both">Both Title & Description</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
              >
                <option value="seo">SEO Optimized</option>
                <option value="engaging">Engaging</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
              >
                <option value="auto">Auto Detect</option>
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">Custom Prompt (Optional)</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter custom instructions..."
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Rewrite Button */}
          <div className="flex gap-3">
            <button
              onClick={handleRewrite}
              disabled={loading}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {loading ? 'Rewriting...' : 'Rewrite Content'}
            </button>

            {result && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Rewritten Content</h3>
              <div className="space-y-3">
                {result.newTitle && (
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">New Title</label>
                    <p className="text-white bg-dark-600 p-2 rounded text-sm">
                      {result.newTitle}
                    </p>
                  </div>
                )}
                {result.newDescription && (
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">New Description</label>
                    <p className="text-white bg-dark-600 p-2 rounded text-sm max-h-32 overflow-y-auto">
                      {result.newDescription}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
