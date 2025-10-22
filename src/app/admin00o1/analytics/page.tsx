'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Eye, MousePointer, Users, Video, Calendar, Download } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

// Type definitions
interface Video {
  id: string
  title: string
  views: number
  likes: number
  dislikes: number
  uploadDate: string
  slug: string
  category: string
  model: string
}

interface Category {
  id: string
  name: string
  videoCount: number
}

interface Model {
  id: string
  name: string
  videoCount: number
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalVideos: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalCategories: 0,
    totalModels: 0,
    viewsByDay: [] as { date: string; views: number }[],
    topVideos: [] as { title: string; views: number; likes: number }[],
    topCategories: [] as { name: string; count: number; views: number }[],
    topModels: [] as { name: string; videos: number; views: number }[],
    recentActivity: [] as { type: string; message: string; time: string; link?: string }[]
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('today')

  // Helper function to get time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }

  const loadAnalytics = useCallback(async () => {
    try {
      // Load real data from API endpoints
      const [videosResponse, categoriesResponse, modelsResponse] = await Promise.all([
        fetch('/api/videos?limit=1000&offset=0'),
        fetch('/api/categories'),
        fetch('/api/models')
      ])

      const [videosData, categoriesData, modelsData] = await Promise.all([
        videosResponse.json(),
        categoriesResponse.json(),
        modelsResponse.json()
      ])

      const videos = videosData.success ? (videosData.videos as Video[]) : []
      const categories = categoriesData.success ? (categoriesData.categories as Category[]) : []
      const models = modelsData.success ? (modelsData.models as Model[]) : []

      // Calculate totals
      const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)
      const totalLikes = videos.reduce((sum, video) => sum + (video.likes || 0), 0)
      const totalDislikes = videos.reduce((sum, video) => sum + (video.dislikes || 0), 0)
      
      // Get top videos (sorted by views)
      const topVideos = videos
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(video => ({
          title: video.title,
          views: video.views || 0,
          likes: video.likes || 0
        }))

      // Get top categories
      const topCategories = categories
        .sort((a, b) => (b.videoCount || 0) - (a.videoCount || 0))
        .slice(0, 5)
        .map(category => ({
          name: category.name,
          count: category.videoCount || 0,
          views: videos
            .filter(v => v.category === category.name)
            .reduce((sum, v) => sum + (v.views || 0), 0)
        }))

      // Get top models
      const topModels = models
        .sort((a, b) => (b.videoCount || 0) - (a.videoCount || 0))
        .slice(0, 5)
        .map(model => ({
          name: model.name,
          videos: model.videoCount || 0,
          views: videos
            .filter(v => v.model === model.name)
            .reduce((sum, v) => sum + (v.views || 0), 0)
        }))

      // Generate views by day based on time range
      const viewsByDay = []
      
      if (timeRange === 'today') {
        // Today - hourly data
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0')
          const dateStr = `${new Date().toISOString().split('T')[0]} ${hour}:00`
          
          // Simulate hourly views
          const hourlyViews = Math.floor(Math.random() * 100) + 50
          viewsByDay.push({ date: dateStr, views: hourlyViews })
        }
      } else if (timeRange === 'yesterday') {
        // Yesterday - hourly data
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0')
          const dateStr = `${yesterdayStr} ${hour}:00`
          
          // Simulate hourly views
          const hourlyViews = Math.floor(Math.random() * 100) + 50
          viewsByDay.push({ date: dateStr, views: hourlyViews })
        }
      } else {
        // Other ranges - daily data
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          // Simulate daily views
          const dailyViews = Math.floor(Math.random() * 1000) + 500
          viewsByDay.push({ date: dateStr, views: dailyViews })
        }
      }

      // Recent activity with real data
      const recentActivity: { type: string; message: string; time: string; link?: string }[] = []
      
      // Filter videos by time range
      const now = new Date()
      const filterDate = new Date()
      
      if (timeRange === 'today') {
        filterDate.setHours(0, 0, 0, 0)
      } else if (timeRange === 'yesterday') {
        filterDate.setDate(filterDate.getDate() - 1)
        filterDate.setHours(0, 0, 0, 0)
      } else if (timeRange === '7d') {
        filterDate.setDate(filterDate.getDate() - 7)
      } else if (timeRange === '30d') {
        filterDate.setDate(filterDate.getDate() - 30)
      } else if (timeRange === '90d') {
        filterDate.setDate(filterDate.getDate() - 90)
      } else if (timeRange === '1y') {
        filterDate.setFullYear(filterDate.getFullYear() - 1)
      }

      // Recent video uploads
      const recentVideos = videos
        .filter(video => {
          const videoDate = new Date(video.uploadDate || new Date())
          return videoDate >= filterDate
        })
        .sort((a, b) => new Date(b.uploadDate || new Date()).getTime() - new Date(a.uploadDate || new Date()).getTime())
        .slice(0, 3)
      
      recentVideos.forEach(video => {
        const timeAgo = getTimeAgo(new Date(video.uploadDate || new Date()))
        recentActivity.push({
          type: 'video',
          message: `New video: ${video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title}`,
          time: timeAgo,
          link: `/video/${video.slug}`
        })
      })

      // High views videos
      const highViewsVideos = videos
        .filter(video => {
          const videoDate = new Date(video.uploadDate || new Date())
          return videoDate >= filterDate && (video.views || 0) >= 1000
        })
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 2)
      
      highViewsVideos.forEach(video => {
        const timeAgo = getTimeAgo(new Date(video.uploadDate || new Date()))
        recentActivity.push({
          type: 'trending',
          message: `High views: ${video.title.length > 25 ? video.title.substring(0, 25) + '...' : video.title} (${video.views?.toLocaleString()} views)`,
          time: timeAgo,
          link: `/video/${video.slug}`
        })
      })

      // High likes videos
      const highLikesVideos = videos
        .filter(video => {
          const videoDate = new Date(video.uploadDate || new Date())
          return videoDate >= filterDate && (video.likes || 0) >= 50
        })
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 2)
      
      highLikesVideos.forEach(video => {
        const timeAgo = getTimeAgo(new Date(video.uploadDate || new Date()))
        recentActivity.push({
          type: 'like',
          message: `High likes: ${video.title.length > 25 ? video.title.substring(0, 25) + '...' : video.title} (${video.likes} likes)`,
          time: timeAgo,
          link: `/video/${video.slug}`
        })
      })

      // Trending categories
      const trendingCategories = topCategories.slice(0, 2)
      trendingCategories.forEach(category => {
        recentActivity.push({
          type: 'category',
          message: `Trending category: ${category.name} (${category.views.toLocaleString()} views)`,
          time: 'Recently',
          link: `/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`
        })
      })

      // Sort by time and limit to 8 activities
      recentActivity.sort((a, b) => {
        if (a.time === 'Recently') return -1
        if (b.time === 'Recently') return 1
        return 0
      }).slice(0, 8)

      const realData = {
        totalViews,
        totalVideos: videos.length,
        totalLikes,
        totalDislikes,
        totalCategories: categories.length,
        totalModels: models.length,
        viewsByDay,
        topVideos,
        topCategories,
        topModels,
        recentActivity
      }
      
      setAnalytics(realData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Chart data configurations
  const viewsChartData = {
    labels: analytics.viewsByDay.map(day => day.date),
    datasets: [
      {
        label: 'Views',
        data: analytics.viewsByDay.map(day => day.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const topVideosChartData = {
    labels: analytics.topVideos.map(video => video.title.length > 20 ? video.title.substring(0, 20) + '...' : video.title),
    datasets: [
      {
        label: 'Views',
        data: analytics.topVideos.map(video => video.views),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const categoriesChartData = {
    labels: analytics.topCategories.map(cat => cat.name),
    datasets: [
      {
        data: analytics.topCategories.map(cat => cat.views),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const topModelsChartData = {
    labels: analytics.topModels.map(model => model.name),
    datasets: [
      {
        label: 'Views',
        data: analytics.topModels.map(model => model.views),
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9CA3AF',
        },
      },
    },
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
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-dark-300">Track your site performance and user engagement</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-green-400 text-sm">+12% from last period</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Videos</p>
                <p className="text-2xl font-bold text-white">{analytics.totalVideos}</p>
                <p className="text-green-400 text-sm">+3 this week</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <MousePointer className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Likes</p>
                <p className="text-2xl font-bold text-white">{analytics.totalLikes.toLocaleString()}</p>
                <p className="text-green-400 text-sm">+5% from last period</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <MousePointer className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-dark-300 text-sm">Total Dislikes</p>
                <p className="text-2xl font-bold text-white">{analytics.totalDislikes.toLocaleString()}</p>
                <p className="text-red-400 text-sm">+2% from last period</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Chart */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">
                {timeRange === 'today' ? 'Views Today (Hourly)' : 
                 timeRange === 'yesterday' ? 'Views Yesterday (Hourly)' : 
                 'Views Over Time'}
              </h2>
            </div>
            
            <div className="h-64">
              <Line data={viewsChartData} options={chartOptions} />
            </div>
          </div>

          {/* Top Videos */}
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold text-white">Top Videos</h2>
            </div>
            
            <div className="h-64">
              <Bar data={topVideosChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Categories */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Top Categories</h2>
            
            <div className="h-64">
              <Doughnut data={categoriesChartData} options={doughnutOptions} />
            </div>
          </div>

          {/* Top Models */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Top Models</h2>
            
            <div className="h-64">
              <Bar data={topModelsChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          </div>
          
          <div className="space-y-4">
            {analytics.recentActivity.map((activity, index) => {
              const getIcon = (type: string) => {
                switch (type) {
                  case 'video':
                    return <Video className="w-5 h-5 text-blue-500" />
                  case 'trending':
                    return <TrendingUp className="w-5 h-5 text-green-500" />
                  case 'like':
                    return <MousePointer className="w-5 h-5 text-pink-500" />
                  case 'category':
                    return <BarChart3 className="w-5 h-5 text-purple-500" />
                  default:
                    return <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                }
              }

              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                  {getIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-white">{activity.message}</p>
                    <p className="text-dark-300 text-sm">{activity.time}</p>
                  </div>
                  {activity.link && (
                    <a 
                      href={activity.link}
                      className="text-primary-500 hover:text-primary-400 text-sm font-medium"
                    >
                      View →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
