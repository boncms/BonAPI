interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 1000 // Maximum cache entries
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  // Cache TTL configurations
  private ttlConfig = {
    // Homepage data - cache shorter for faster updates
    'homepage:featured': 2 * 60 * 1000, // 2 minutes
    'homepage:random': 2 * 60 * 1000, // 2 minutes
    'homepage:mostViewed': 2 * 60 * 1000, // 2 minutes
    'homepage:categories': 30 * 60 * 1000, // 30 minutes
    
    // Video data - cache medium
    'video:details': 5 * 60 * 1000, // 5 minutes
    'video:related': 5 * 60 * 1000, // 5 minutes
    'video:views': 2 * 60 * 1000, // 2 minutes
    
    // Model data - cache longer
    'model:details': 15 * 60 * 1000, // 15 minutes
    'model:videos': 10 * 60 * 1000, // 10 minutes
    
    // Search and navigation - cache short
    'search:results': 2 * 60 * 1000, // 2 minutes
    'navigation:categories': 30 * 60 * 1000, // 30 minutes
    
    // Admin data - cache short
    'admin:analytics': 1 * 60 * 1000, // 1 minute
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    const ttl = customTTL || (this.ttlConfig as any)[key] || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  // Get with fallback function
  async getOrSet<T>(
    key: string, 
    fallback: () => Promise<T>, 
    customTTL?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fallback()
    this.set(key, data, customTTL)
    return data
  }

  // Invalidate cache by pattern
  invalidate(pattern: string): void {
    const keysToDelete: string[] = []
    
    // Collect keys to delete
    this.cache.forEach((_, key) => {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key)
      }
    })
    
    // Delete collected keys
    keysToDelete.forEach(key => this.cache.delete(key))
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`)
    }
  }

  // Invalidate specific key
  delete(key: string): void {
    this.cache.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache stats
  getStats() {
    const keys: string[] = []
    this.cache.forEach((_, key) => keys.push(key))
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys
    }
  }

  // Warm up cache with essential data (server-side only)
  async warmUp() {
    if (typeof window !== 'undefined') return // Skip on client-side
    
    console.log('🔥 Warming up cache...')
    
    // Clear all existing cache first
    this.clear()
    
    // Pre-cache homepage data
    try {
      const { dbService } = await import('./database')
      
      // Cache categories (long TTL)
      const categories = await dbService.getCategories()
      this.set('homepage:categories', categories)
      
      // Cache featured videos
      const featuredVideos = await dbService.getFeaturedVideos()
      this.set('homepage:featured', featuredVideos)
      
      console.log('✅ Cache warmed up successfully')
    } catch (error) {
      console.error('❌ Cache warm up failed:', error)
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Auto warm up on import (server-side only)
if (typeof window === 'undefined') {
  cacheService.warmUp()
}
