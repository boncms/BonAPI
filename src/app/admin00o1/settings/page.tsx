'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Eye, EyeOff, Palette, Globe, Shield, Code } from 'lucide-react'
import Modal from '@/components/admin/Modal'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    adminPassword: '',
    primaryColor: '#3b82f6',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    logoUrl: '',
    faviconUrl: '',
    footerText: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    homepageFeaturedPerPage: 30,
    homepageOnlyfansCount: 15,
    homepageHotWeeklyCount: 15,
    homepageModelsCount: 12,
    homepageCrazyCategoriesCount: 12,
    headerScript: '',
    bodyScript: '',
    footerScript: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal states
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/settings?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()
      // Ensure all values are defined to prevent controlled/uncontrolled input warning
      setSettings({
        siteName: data.siteName || '',
        siteDescription: data.siteDescription || '',
        siteUrl: data.siteUrl || '',
        adminPassword: data.adminPassword || '',
        primaryColor: data.primaryColor || '#3b82f6',
        backgroundColor: data.backgroundColor || '#0f172a',
        textColor: data.textColor || '#ffffff',
        logoUrl: data.logoUrl || '',
        faviconUrl: data.faviconUrl || '',
        footerText: data.footerText || '',
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        seoKeywords: data.seoKeywords || '',
        homepageFeaturedPerPage: data.homepageFeaturedPerPage ?? 30,
        homepageOnlyfansCount: data.homepageOnlyfansCount ?? 15,
        homepageHotWeeklyCount: data.homepageHotWeeklyCount ?? 15,
        homepageModelsCount: data.homepageModelsCount ?? 12,
        homepageCrazyCategoriesCount: data.homepageCrazyCategoriesCount ?? 12,
        headerScript: data.headerScript || '',
        bodyScript: data.bodyScript || '',
        footerScript: data.footerScript || ''
      })
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...settings } as any
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Settings saved successfully!',
          type: 'success'
        })
        // Trigger settings update event for all components
        window.dispatchEvent(new CustomEvent('settingsUpdated'))
        // Reload settings to get updated values
        await loadSettings()
      } else {
        setModal({
          isOpen: true,
          title: 'Save Failed',
          message: 'Failed to save settings',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setModal({
        isOpen: true,
        title: 'Save Failed',
        message: 'An error occurred while saving settings',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value || '' }))
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-dark-300">Manage your site configuration and preferences</p>
        </div>

        <div className="space-y-8">
          {/* Homepage Sections Display Counts */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">Homepage Display</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Featured per page</label>
                <input
                  type="number"
                  name="homepageFeaturedPerPage"
                  value={(settings as any).homepageFeaturedPerPage}
                  onChange={handleInputChange}
                  min={5}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Onlyfans Premium count</label>
                <input
                  type="number"
                  name="homepageOnlyfansCount"
                  value={(settings as any).homepageOnlyfansCount}
                  onChange={handleInputChange}
                  min={5}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
      
              <div>
                <label className="block text-sm font-medium text-white mb-2">Hot Weekly count</label>
                <input
                  type="number"
                  name="homepageHotWeeklyCount"
                  value={(settings as any).homepageHotWeeklyCount}
                  onChange={handleInputChange}
                  min={5}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Models count</label>
                <input
                  type="number"
                  name="homepageModelsCount"
                  value={(settings as any).homepageModelsCount}
                  onChange={handleInputChange}
                  min={6}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Crazy Categories count</label>
                <input
                  type="number"
                  name="homepageCrazyCategoriesCount"
                  value={(settings as any).homepageCrazyCategoriesCount}
                  onChange={handleInputChange}
                  min={6}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          {/* General Settings */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">General Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Site Name</label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Logo URL</label>
                <input
                  type="url"
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Favicon URL</label>
                <input
                  type="url"
                  name="faviconUrl"
                  value={settings.faviconUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-white mb-2">Site URL</label>
              <input
                type="url"
                name="siteUrl"
                value={settings.siteUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://yourdomain.com"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-white mb-2">Site Description</label>
              <textarea
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-white mb-2">Footer Text</label>
              <input
                type="text"
                name="footerText"
                value={settings.footerText}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Security Settings</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="adminPassword"
                  value={settings.adminPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Theme Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={settings.primaryColor}
                    onChange={handleInputChange}
                    className="w-12 h-10 bg-dark-700 border border-dark-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={settings.primaryColor}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="backgroundColor"
                    value={settings.backgroundColor}
                    onChange={handleInputChange}
                    className="w-12 h-10 bg-dark-700 border border-dark-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="backgroundColor"
                    value={settings.backgroundColor}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="textColor"
                    value={settings.textColor}
                    onChange={handleInputChange}
                    className="w-12 h-10 bg-dark-700 border border-dark-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="textColor"
                    value={settings.textColor}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold text-white">SEO Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">SEO Title</label>
                <input
                  type="text"
                  name="seoTitle"
                  value={settings.seoTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">SEO Description</label>
                <textarea
                  name="seoDescription"
                  value={settings.seoDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">SEO Keywords</label>
                <input
                  type="text"
                  name="seoKeywords"
                  value={settings.seoKeywords}
                  onChange={handleInputChange}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Custom Scripts */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Custom Scripts</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Header Script</label>
                <p className="text-sm text-dark-400 mb-3">Scripts that will be loaded in the &lt;head&gt; section</p>
                <textarea
                  name="headerScript"
                  value={settings.headerScript}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="<!-- Google Analytics, Meta tags, etc. -->"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Body Script</label>
                <p className="text-sm text-dark-400 mb-3">Scripts that will be loaded at the beginning of &lt;body&gt;</p>
                <textarea
                  name="bodyScript"
                  value={settings.bodyScript}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="<!-- Chat widgets, tracking pixels, etc. -->"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Footer Script</label>
                <p className="text-sm text-dark-400 mb-3">Scripts that will be loaded before closing &lt;/body&gt; tag</p>
                <textarea
                  name="footerScript"
                  value={settings.footerScript}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="<!-- Analytics, external libraries, etc. -->"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

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
