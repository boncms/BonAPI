'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'
import { 
  Video, 
  Users, 
  Tag, 
  Megaphone, 
  BarChart3, 
  Eye, 
  MousePointer,
  TrendingUp,
  Calendar,
  Code,
  Settings
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    videos: 0,
    models: 0,
    categories: 0,
    ads: 0,
    totalViews: 0,
    totalImpressions: 0,
    totalClicks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load analytics from dedicated API
      const analyticsResponse = await fetch('/api/analytics')
      const analyticsData = await analyticsResponse.json()
      
      if (analyticsData.success) {
        setStats({
          videos: analyticsData.stats.videos,
          models: analyticsData.stats.models,
          categories: analyticsData.stats.categories,
          ads: analyticsData.stats.ads,
          totalViews: analyticsData.stats.totalViews,
          totalImpressions: analyticsData.stats.totalImpressions,
          totalClicks: analyticsData.stats.totalClicks
        })
      } else {
        console.error('Failed to load analytics:', analyticsData.message)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Manage Videos',
      description: 'Add, edit, and organize video content',
      href: '/admin00o1/videos',
      icon: Video,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Manage Models',
      description: 'Manage model profiles and information',
      href: '/admin00o1/models',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Manage Categories',
      description: 'Organize content with categories',
      href: '/admin00o1/categories',
      icon: Tag,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Manage Ads',
      description: 'Create and manage advertisements',
      href: '/admin00o1/ads',
      icon: Megaphone,
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'Analytics',
      description: 'View site performance and statistics',
      href: '/admin00o1/analytics',
      icon: BarChart3,
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      title: 'API Management',
      description: 'Manage API keys and endpoints',
      href: '/admin00o1/api',
      icon: Code,
      color: 'bg-teal-600 hover:bg-teal-700'
    },
    {
      title: 'Settings',
      description: 'Configure site settings and preferences',
      href: '/admin00o1/settings',
      icon: Settings,
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ]

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-dark-300">Welcome to the xCMS administration panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Videos</p>
                <p className="text-2xl font-bold text-white">{stats.videos.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-dark-300 text-sm">Models</p>
                <p className="text-2xl font-bold text-white">{stats.models.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-dark-300 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">{stats.categories.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-dark-300 text-sm">Active Ads</p>
                <p className="text-2xl font-bold text-white">{stats.ads.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalViews)}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-dark-300 text-sm">Ad Impressions</p>
                <p className="text-2xl font-bold text-white">{stats.totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <MousePointer className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-dark-300 text-sm">Ad Clicks</p>
                <p className="text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="bg-dark-800 rounded-lg p-6 hover:bg-dark-700 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                    <p className="text-dark-300 text-sm">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">New video uploaded</p>
                <p className="text-dark-300 text-sm">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">New ad campaign created</p>
                <p className="text-dark-300 text-sm">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg">
              <div className="p-2 bg-green-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Model profile updated</p>
                <p className="text-dark-300 text-sm">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
