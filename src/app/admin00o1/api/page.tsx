'use client'

import { useState, useEffect } from 'react'
import { Code, Zap, Key, Globe, RefreshCw, Copy, Check } from 'lucide-react'

interface ApiKey {
  id: number
  key: string
  name: string
  created: string
}

export default function APIManagementPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [endpoints, setEndpoints] = useState([
    {
      method: 'GET',
      path: '/api/videos',
      description: 'Get all videos',
      example: 'GET /api/videos?page=1&limit=10'
    },
    {
      method: 'POST',
      path: '/api/videos',
      description: 'Create a new video',
      example: 'POST /api/videos'
    },
    {
      method: 'GET',
      path: '/api/videos/[id]',
      description: 'Get video by ID',
      example: 'GET /api/videos/1'
    },
    {
      method: 'PUT',
      path: '/api/videos/[id]',
      description: 'Update video by ID',
      example: 'PUT /api/videos/1'
    },
    {
      method: 'DELETE',
      path: '/api/videos/[id]',
      description: 'Delete video by ID',
      example: 'DELETE /api/videos/1'
    },
    {
      method: 'GET',
      path: '/api/categories',
      description: 'Get all categories',
      example: 'GET /api/categories'
    },
    {
      method: 'GET',
      path: '/api/models',
      description: 'Get all models',
      example: 'GET /api/models'
    },
    {
      method: 'GET',
      path: '/api/ads',
      description: 'Get all ads',
      example: 'GET /api/ads?position=top&active=true'
    },
    {
      method: 'GET',
      path: '/api/settings',
      description: 'Get site settings',
      example: 'GET /api/settings'
    },
    {
      method: 'PUT',
      path: '/api/settings',
      description: 'Update site settings',
      example: 'PUT /api/settings'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [copiedEndpoint, setCopiedEndpoint] = useState('')

  const copyToClipboard = async (text: string, endpoint: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedEndpoint(endpoint)
      setTimeout(() => setCopiedEndpoint(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const generateApiKey = () => {
    const newKey = 'xcm_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
    setApiKeys([...apiKeys, { id: Date.now(), key: newKey, name: 'New API Key', created: new Date().toISOString() }])
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-600'
      case 'POST': return 'bg-blue-600'
      case 'PUT': return 'bg-yellow-600'
      case 'DELETE': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">API Management</h1>
          <p className="text-dark-300">Manage your API keys and explore available endpoints</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Keys */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Key className="w-6 h-6 text-primary-500" />
                <h2 className="text-xl font-bold text-white">API Keys</h2>
              </div>
              <button
                onClick={generateApiKey}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Generate New Key
              </button>
            </div>

            <div className="space-y-4">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                  <p className="text-dark-300">No API keys generated yet</p>
                  <p className="text-dark-400 text-sm">Generate your first API key to start using the API</p>
                </div>
              ) : (
                apiKeys.map((apiKey: any) => (
                  <div key={apiKey.id} className="p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{apiKey.name}</h3>
                      <span className="text-dark-400 text-sm">
                        {new Date(apiKey.created).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-dark-600 text-green-400 rounded text-sm font-mono">
                        {apiKey.key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                        className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                      >
                        {copiedEndpoint === apiKey.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* API Documentation */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold text-white">API Endpoints</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold text-white rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-primary-400 font-mono text-sm">{endpoint.path}</code>
                  </div>
                  <p className="text-dark-300 text-sm mb-2">{endpoint.description}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-dark-600 text-white rounded text-sm font-mono">
                      {endpoint.example}
                    </code>
                    <button
                      onClick={() => copyToClipboard(endpoint.example, endpoint.path)}
                      className="p-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded transition-colors"
                    >
                      {copiedEndpoint === endpoint.path ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Usage Stats */}
        <div className="mt-8 bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">API Usage Statistics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">1,250</p>
              <p className="text-dark-300 text-sm">Total Requests</p>
              <p className="text-green-400 text-xs">+15% this month</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">98.5%</p>
              <p className="text-dark-300 text-sm">Uptime</p>
              <p className="text-green-400 text-xs">Last 30 days</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">45ms</p>
              <p className="text-dark-300 text-sm">Avg Response Time</p>
              <p className="text-green-400 text-xs">-5ms improvement</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-dark-300 text-sm">Active Keys</p>
              <p className="text-blue-400 text-xs">2 keys created today</p>
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="mt-8 bg-dark-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Rate Limits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-medium mb-3">Free Tier</h3>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li>• 1,000 requests per hour</li>
                <li>• 10,000 requests per day</li>
                <li>• Basic endpoints only</li>
                <li>• No custom headers</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3">Pro Tier</h3>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li>• 10,000 requests per hour</li>
                <li>• 100,000 requests per day</li>
                <li>• All endpoints available</li>
                <li>• Custom headers supported</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Test */}
        <div className="mt-8 bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-white">Quick API Test</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Test Endpoint</label>
              <div className="flex gap-2">
                <select className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  placeholder="/api/videos"
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Test
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Response</label>
              <pre className="w-full p-4 bg-dark-700 border border-dark-600 rounded-lg text-green-400 text-sm font-mono overflow-x-auto">
                {`{
  "status": "success",
  "data": [...],
  "message": "Request completed successfully"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
