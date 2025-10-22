'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Video, 
  Users, 
  Tag, 
  BarChart3, 
  Settings,
  Megaphone,
  Code,
  Menu,
  X,
  Download,
  Layout,
  Database,
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin00o1', icon: Home },
  { name: 'Videos', href: '/admin00o1/videos', icon: Video },
  { name: 'Models', href: '/admin00o1/models', icon: Users },
  { name: 'Categories', href: '/admin00o1/categories', icon: Tag },
  { name: 'Custom Sections', href: '/admin00o1/custom-sections', icon: Layout },
  { name: 'Scraper', href: '/admin00o1/scraper', icon: Download },
  { name: 'Ads', href: '/admin00o1/ads', icon: Megaphone },
  { name: 'Analytics', href: '/admin00o1/analytics', icon: BarChart3 },
  { name: 'API', href: '/admin00o1/api', icon: Code },
  { name: 'Settings', href: '/admin00o1/settings', icon: Settings },
  { name: 'Backup', href: '/admin00o1/backup', icon: Database },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await res.json()
        if (!data?.authenticated) {
          const from = pathname || '/admin00o1'
          router.replace(`/login?from=${encodeURIComponent(from)}`)
        } else {
          setAuthChecked(true)
        }
      } catch {
        const from = pathname || '/admin00o1'
        router.replace(`/login?from=${encodeURIComponent(from)}`)
      }
    }
    checkAuth()
  }, [pathname, router])

  const handleLogout = async () => {
    if (loggingOut) return
    
    setLoggingOut(true)
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (res.ok) {
        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        // Redirect to login
        router.replace('/login')
      } else {
        console.error('Logout failed')
        // Force redirect anyway
        router.replace('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect anyway
      router.replace('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-dark-800">
          <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-dark-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-4 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-dark-700">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-800">
          <div className="flex items-center h-16 px-4 border-b border-dark-700">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <nav className="mt-4 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-dark-700">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-dark-700 bg-dark-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-dark-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="text-sm text-dark-300">
                Welcome to Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
