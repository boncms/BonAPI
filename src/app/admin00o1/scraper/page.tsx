'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Download, RefreshCw, AlertCircle, CheckCircle, Clock, Plus, Trash2, Edit } from 'lucide-react'
import Modal from '@/components/admin/Modal'

interface ScrapingStatus {
  isRunning: boolean
  currentPage: number
  totalPages: number
  processed: number
  total: number
  errors: number
  created: number
  updated: number
  currentItem: string
  type: 'movies' | 'categories' | 'actors' | 'countries'
  keyword?: string
  logs?: { timestamp: string; type: string; title: string; status: 'created' | 'updated' | 'error' | 'info'; message?: string }[]
}

interface AutoScrapeConfig {
  id: string
  enabled: boolean
  interval: number
  type: 'movies' | 'categories' | 'actors' | 'countries'
  startPage: number
  endPage: number
  keyword?: string
  lastRun?: string
  nextRun?: string
}

export default function ScraperPage() {
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(10)
  const [scrapingType, setScrapingType] = useState<'movies' | 'categories' | 'actors' | 'countries'>('movies')
  const [keyword, setKeyword] = useState('')
  const [updateExisting, setUpdateExisting] = useState<boolean>(false)
  const [status, setStatus] = useState<ScrapingStatus>({
    isRunning: false,
    currentPage: 0,
    totalPages: 0,
    processed: 0,
    total: 0,
    errors: 0,
    created: 0,
    updated: 0,
    currentItem: '',
    type: 'movies'
  })
  // Preview removed
  const itemsPerPage = 20
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  
  // Auto-scraping states
  const [autoConfigs, setAutoConfigs] = useState<AutoScrapeConfig[]>([])
  const [showAutoForm, setShowAutoForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AutoScrapeConfig | null>(null)
  const [autoForm, setAutoForm] = useState({
    enabled: true,
    interval: 15,
    type: 'movies' as 'movies' | 'categories' | 'actors' | 'countries',
    startPage: 1,
    endPage: 5,
    keyword: '',
    updateExisting: false
  })
  const [pageDelayMs, setPageDelayMs] = useState<number>(500)
  const [requestTimeoutMs, setRequestTimeoutMs] = useState<number>(10000)

  // Modal states
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  })

  // Preview removed

  const handleStartScraping = async () => {
    // Prevent double-click
    if (status.isRunning) {
      return
    }

    try {
      // Reset state first
      await fetch('/api/scraper/reset', { method: 'POST' })
      
      setStatus(prev => ({ ...prev, isRunning: true, type: scrapingType }))
      
      const response = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: scrapingType,
          startPage,
          endPage,
          keyword: keyword.trim() || undefined,
          updateExisting,
          pageDelayMs,
          requestTimeoutMs
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        setModal({
          isOpen: true,
          title: 'Bắt đầu cào dữ liệu thất bại',
          message: data.message,
          type: 'error'
        })
        setStatus(prev => ({ ...prev, isRunning: false }))
      } else {
        // Start SSE stream
        if (eventSource) {
          eventSource.close()
        }
        const es = new EventSource('/api/scraper/status/stream')
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data)
            if (data.success && data.status) {
              setStatus(data.status)
            }
          } catch {}
        }
        es.onerror = () => {
          es.close()
        }
        setEventSource(es)
      }
    } catch (error) {
      console.error('Start scraping error:', error)
      setModal({
        isOpen: true,
        title: 'Bắt đầu cào dữ liệu thất bại',
        message: 'Có lỗi xảy ra khi bắt đầu quá trình cào dữ liệu',
        type: 'error'
      })
      setStatus(prev => ({ ...prev, isRunning: false }))
    }
  }

  const handleStopScraping = async () => {
    try {
      await fetch('/api/scraper/stop', { method: 'POST' })
      setStatus(prev => ({ ...prev, isRunning: false }))
      
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }
    } catch (error) {
      console.error('Stop scraping error:', error)
    }
  }

  const handleRefreshStatus = async () => {}

  // Load auto-scrape configs on mount
  useEffect(() => {
    loadAutoConfigs()
  }, [])

  // Cleanup SSE on unmount
  React.useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

  const loadAutoConfigs = async () => {
    try {
      const response = await fetch('/api/scraper/auto')
      const data = await response.json()
      if (data.success) {
        setAutoConfigs(data.configs)
      }
      
      // Initialize auto-scraping intervals
      try {
        await fetch('/api/scraper/auto/init', { method: 'POST' })
        console.log('Auto-scraping initialized')
      } catch (error) {
        console.error('Error initializing auto-scraping:', error)
      }
    } catch (error) {
      console.error('Error loading auto configs:', error)
    }
  }

  const handleCreateAutoConfig = async () => {
    try {
      const response = await fetch('/api/scraper/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoForm)
      })
      
      const data = await response.json()
      if (data.success) {
        setAutoConfigs(prev => [...prev, data.config])
        setShowAutoForm(false)
        setAutoForm({
          enabled: true,
          interval: 15,
          type: 'movies',
          startPage: 1,
          endPage: 5,
          keyword: '',
          updateExisting: false
        })
        
        // Re-initialize auto-scraping to start the new interval
        try {
          await fetch('/api/scraper/auto/init', { method: 'POST' })
        } catch (error) {
          console.error('Error re-initializing auto-scraping:', error)
        }
        
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Auto-scrape configuration created successfully',
          type: 'success'
        })
      } else {
        setModal({
          isOpen: true,
          title: 'Create Failed',
          message: data.message,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error creating auto config:', error)
      setModal({
        isOpen: true,
        title: 'Create Failed',
        message: 'An error occurred while creating the auto-scrape configuration',
        type: 'error'
      })
    }
  }

  const handleUpdateAutoConfig = async () => {
    if (!editingConfig) return
    
    try {
      const response = await fetch('/api/scraper/auto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingConfig.id,
          ...autoForm
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setAutoConfigs(prev => prev.map(c => c.id === editingConfig.id ? data.config : c))
        setEditingConfig(null)
        setShowAutoForm(false)
        setAutoForm({
          enabled: true,
          interval: 15,
          type: 'movies',
          startPage: 1,
          endPage: 5,
          keyword: '',
          updateExisting: false
        })
        
        // Re-initialize auto-scraping to update the interval
        try {
          await fetch('/api/scraper/auto/init', { method: 'POST' })
        } catch (error) {
          console.error('Error re-initializing auto-scraping:', error)
        }
        
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Auto-scrape configuration updated successfully',
          type: 'success'
        })
      } else {
        setModal({
          isOpen: true,
          title: 'Update Failed',
          message: data.message,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error updating auto config:', error)
      setModal({
        isOpen: true,
        title: 'Update Failed',
        message: 'An error occurred while updating the auto-scrape configuration',
        type: 'error'
      })
    }
  }

  const handleDeleteAutoConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this auto-scrape config?')) return
    
    try {
      const response = await fetch(`/api/scraper/auto?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        setAutoConfigs(prev => prev.filter(c => c.id !== id))
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Auto-scrape configuration deleted successfully',
          type: 'success'
        })
      } else {
        setModal({
          isOpen: true,
          title: 'Delete Failed',
          message: data.message,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error deleting auto config:', error)
      setModal({
        isOpen: true,
        title: 'Delete Failed',
        message: 'An error occurred while deleting the auto-scrape configuration',
        type: 'error'
      })
    }
  }

  const handleEditAutoConfig = (config: AutoScrapeConfig) => {
    setEditingConfig(config)
    setAutoForm({
      enabled: config.enabled,
      interval: config.interval,
      type: config.type,
      startPage: config.startPage,
      endPage: config.endPage,
      keyword: config.keyword || '',
      updateExisting: Boolean((config as any).updateExisting)
    })
    setShowAutoForm(true)
  }

  const handleClearAllIntervals = async () => {
    if (!confirm('Are you sure you want to clear all auto-scrape intervals? This will stop all running auto-scrapers.')) return
    
    try {
      const response = await fetch('/api/scraper/auto/clear', {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'All auto-scrape intervals cleared successfully',
          type: 'success'
        })
      } else {
        setModal({
          isOpen: true,
          title: 'Clear Failed',
          message: data.message,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error clearing intervals:', error)
      setModal({
        isOpen: true,
        title: 'Clear Failed',
        message: 'An error occurred while clearing intervals',
        type: 'error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Scraper</h1>
          <p className="text-dark-300">Scrape content from porn-api.com with intelligent pagination</p>
        </div>

        {/* Scraper Configuration */}
        <div className="bg-dark-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Scrape Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scraping Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Content Type</label>
              <select
                value={scrapingType}
                onChange={(e) => setScrapingType(e.target.value as any)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={status.isRunning}
              >
                <option value="movies">Movies</option>
                <option value="categories">Categories</option>
                <option value="actors">Actors</option>
                <option value="countries">Countries</option>
              </select>
            </div>

            {/* Keyword (for movies search) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Keyword (Movies)</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Ava"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={status.isRunning}
              />
            </div>

            {/* Page Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Start Page</label>
                <input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={status.isRunning}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">End Page</label>
                <input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(parseInt(e.target.value) || 10)}
                  min="1"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={status.isRunning}
                />
              </div>
            </div>
          </div>
          {/* Timing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Delay giữa các trang (ms)</label>
              <input
                type="number"
                min={0}
                value={pageDelayMs}
                onChange={(e) => setPageDelayMs(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={status.isRunning}
              />
              <p className="text-xs text-dark-400 mt-1">0 = no delay. Default 500ms</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Request timeout (ms)</label>
              <input
                type="number"
                min={1000}
                value={requestTimeoutMs}
                onChange={(e) => setRequestTimeoutMs(Math.max(1000, parseInt(e.target.value) || 10000))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={status.isRunning}
              />
              <p className="text-xs text-dark-400 mt-1">Minimum 1000ms. Default 10000ms.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2 mr-auto">
            <input
              id="updateExisting"
              type="checkbox"
              className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              disabled={status.isRunning}
            />
            <label htmlFor="updateExisting" className="text-white text-sm">Update existing videos?</label>
          </div>
            {/* Preview removed */}
            
            {!status.isRunning ? (
              <button
                onClick={handleStartScraping}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Scraping
              </button>
            ) : (
              <button
                onClick={handleStopScraping}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Stop Scraping
              </button>
            )}
            
            {/* Manual refresh removed for live SSE updates */}
          </div>
        </div>

        {/* Scraping Status */}
        {(status.isRunning || status.processed > 0) && (
          <div className="bg-dark-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Scraping Status</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-dark-300">Current Page</div>
                <div className="text-2xl font-bold text-white">{status.currentPage} / {status.totalPages}</div>
              </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="text-sm text-dark-300">Processed</div>
              <div className="text-2xl font-bold text-green-400">{status.processed}</div>
              <div className="text-xs text-dark-400 mt-1">
                {status.created} New, {status.updated} Update
              </div>
            </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-dark-300">Total Found</div>
                <div className="text-2xl font-bold text-blue-400">{status.total}</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-dark-300">Errors</div>
                <div className="text-2xl font-bold text-red-400">{status.errors}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.totalPages > 0 ? (status.currentPage / status.totalPages) * 100 : 0}%` }}
              ></div>
            </div>

            {/* Current Item */}
            {status.currentItem && (
              <div className="text-dark-300">
                <span className="text-white">Processing:</span> {status.currentItem}
              </div>
            )}

            {/* Live Logs */}
            {status.logs && status.logs.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-white">Activity Logs</h3>
                </div>
                <div className="max-h-80 overflow-y-auto bg-dark-900 border border-dark-700 rounded">
                  {status.logs?.slice(-100).reverse().map((log, idx) => (
                    <div key={`${log.timestamp}-${idx}`} className="px-3 py-2 text-sm border-b border-dark-800 hover:bg-dark-800 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="text-dark-300 flex items-center">
                          <span className="text-dark-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span> 
                          <span className="text-blue-400 ml-2">{log.type.toUpperCase()}</span>
                          <span className="text-white ml-2 font-medium">
                            {log.title}
                            {log.message && (
                              <span className="text-dark-400 ml-2">|</span>
                            )}
                            {log.message && (
                              <span className={
                                log.status === 'error' ? 'text-red-400' : 
                                log.status === 'updated' ? 'text-yellow-300' : 
                                log.status === 'created' ? 'text-green-400' :
                                log.status === 'info' ? 'text-blue-400' : 'text-gray-400'
                              }>
                                {log.message}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className={
                          log.status === 'error' ? 'text-red-400 font-semibold' : 
                          log.status === 'updated' ? 'text-yellow-300 font-semibold' : 
                          log.status === 'created' ? 'text-green-400 font-semibold' :
                          log.status === 'info' ? 'text-blue-400 font-semibold' : 'text-gray-400'
                        }>
                          {log.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Message */}
            {!status.isRunning && status.processed > 0 && (
              <div className="mt-4 p-4 bg-green-900 border border-green-700 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Scraping completed!</span>
                </div>
                <div className="text-green-300 text-sm mt-1">
                  Processed {status.processed} items: {status.created} New, {status.updated} Update, {status.errors} Errors
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview removed */}

        {/* Auto-Scraping Section */}
        <div className="bg-dark-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Auto-Scraping</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearAllIntervals}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Intervals
              </button>
              <button
                onClick={() => setShowAutoForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Auto-Scrape
              </button>
            </div>
          </div>

          {autoConfigs.length > 0 ? (
            <div className="space-y-3">
              {autoConfigs.map((config) => (
                <div key={config.id} className="bg-dark-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">
                          {config.type} - Pages {config.startPage}-{config.endPage}
                        </span>
                        {config.keyword && (
                          <span className="text-blue-300">(Keyword: {config.keyword})</span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          config.enabled ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="text-dark-300 text-sm">
                        Interval: {config.interval} minutes
                        {config.lastRun && (
                          <span> | Last run: {new Date(config.lastRun).toLocaleString()}</span>
                        )}
                        {config.nextRun && (
                          <span> | Next run: {new Date(config.nextRun).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAutoConfig(config)}
                        className="p-2 text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAutoConfig(config.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-300">
              <Clock className="w-12 h-12 mx-auto mb-4 text-dark-600" />
              <p>No auto-scraping configurations yet</p>
              <p className="text-sm">Create one to automatically scrape content at regular intervals</p>
            </div>
          )}
        </div>

        {/* Auto-Scrape Form Modal */}
        {showAutoForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">
                {editingConfig ? 'Edit Auto-Scrape' : 'Add Auto-Scrape'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content Type</label>
                  <select
                    value={autoForm.type}
                    onChange={(e) => setAutoForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="movies">Movies</option>
                    <option value="categories">Categories</option>
                    <option value="actors">Actors</option>
                    <option value="countries">Countries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Interval (minutes)</label>
                  <select
                    value={autoForm.interval}
                    onChange={(e) => setAutoForm(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                    <option value={480}>8 hours</option>
                    <option value={720}>12 hours</option>
                    <option value={1440}>24 hours</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Start Page</label>
                    <input
                      type="number"
                      value={autoForm.startPage}
                      onChange={(e) => setAutoForm(prev => ({ ...prev, startPage: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">End Page</label>
                    <input
                      type="number"
                      value={autoForm.endPage}
                      onChange={(e) => setAutoForm(prev => ({ ...prev, endPage: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {autoForm.type === 'movies' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Keyword (optional)</label>
                    <input
                      type="text"
                      value={autoForm.keyword}
                      onChange={(e) => setAutoForm(prev => ({ ...prev, keyword: e.target.value }))}
                      placeholder="e.g. Ava"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoUpdateExisting"
                    checked={autoForm.updateExisting}
                    onChange={(e) => setAutoForm(prev => ({ ...prev, updateExisting: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="autoUpdateExisting" className="text-white">Update data old videos?</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={autoForm.enabled}
                    onChange={(e) => setAutoForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="enabled" className="text-white">Enable auto-scraping</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingConfig ? handleUpdateAutoConfig : handleCreateAutoConfig}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingConfig ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowAutoForm(false)
                    setEditingConfig(null)
                    setAutoForm({
                      enabled: true,
                      interval: 15,
                      type: 'movies',
                      startPage: 1,
                      endPage: 5,
                      keyword: '',
                      updateExisting: false
                    })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
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
