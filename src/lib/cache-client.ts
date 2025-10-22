// Client-side cache service (no database imports)
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class ClientCacheService {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 500 // Smaller cache for client
  private defaultTTL = 2 * 60 * 1000 // 2 minutes default

  // Cache TTL configurations (shorter for client)
  private ttlConfig = {
    // Homepage data - cache shorter
    'homepage:featured': 1 * 60 * 1000, // 1 minute
    'homepage:random': 1 * 60 * 1000, // 1 minute
    'homepage:mostViewed': 1 * 60 * 1000, // 1 minute
    'homepage:categories': 5 * 60 * 1000, // 5 minutes
    
    // Video data - cache short
    'video:details': 2 * 60 * 1000, // 2 minutes
    'video:related': 2 * 60 * 1000, // 2 minutes
    'video:views': 1 * 60 * 1000, // 1 minute
    
    // Model data - cache medium
    'model:details': 5 * 60 * 1000, // 5 minutes
    'model:videos': 3 * 60 * 1000, // 3 minutes
    
    // Search and navigation - cache short
    'search:results': 1 * 60 * 1000, // 1 minute
    'navigation:categories': 5 * 60 * 1000, // 5 minutes
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

  // Get with fallback function (for API calls)
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
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    
    // Collect keys to delete
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    // Delete collected keys
    keysToDelete.forEach(key => this.cache.delete(key))
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
}

// Export singleton instance for client-side
export const clientCacheService = new ClientCacheService()

// Helper function to check if we're on client-side
export const isClient = typeof window !== 'undefined'

// Export appropriate cache service based on environment
export const cacheService = isClient ? clientCacheService : null
