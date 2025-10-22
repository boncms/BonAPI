'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Home, Play, User, Grid } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import BeautifulLogo from './BeautifulLogo'
import { memo } from 'react'

function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const { settings } = useSettings()

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/videos?search=${encodeURIComponent(q)}`)
  }, [router, searchQuery])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const navLinkClass = useMemo(() => (base: string, active: boolean) => (
    `${base} ${active ? 'bg-primary-600 text-white' : 'text-dark-300 hover:bg-dark-700'}`
  ), [])

  const instantNav = useCallback((href: string) => (e: React.MouseEvent) => {
    // Navigate immediately on mousedown for snappier UX
    e.preventDefault()
    router.push(href)
  }, [router])

  return (
    <header className="bg-dark-800 border-b-2 border-primary-600 z-50 overflow-x-hidden">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between py-3 md:py-4 gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <BeautifulLogo />
          </div>

          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md order-2 md:order-none w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={onChange}
                suppressHydrationWarning
                className="w-full pl-10 pr-3 sm:pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          <nav className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto order-3 md:order-none">
            <Link prefetch href="/" onMouseDown={instantNav('/')} className={navLinkClass('flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors', pathname === '/') }>
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link prefetch href="/videos" onMouseDown={instantNav('/videos')} className={navLinkClass('flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors', pathname === '/videos') }>
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Videos</span>
            </Link>
            <Link prefetch href="/models" onMouseDown={instantNav('/models')} className={navLinkClass('flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors', pathname === '/models') }>
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Models</span>
            </Link>
            <Link prefetch href="/categories" onMouseDown={instantNav('/categories')} className={navLinkClass('flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors', pathname === '/categories') }>
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default memo(Header)
