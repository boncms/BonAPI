import { cacheService } from './cache'

// Cache invalidation patterns for different data types
export const cacheInvalidation = {
  // Invalidate all video-related cache
  invalidateVideos: () => {
    cacheService.invalidate('video:')
    cacheService.invalidate('homepage:')
    cacheService.invalidate('search:videos:')
    // Also invalidate paginated video caches
    cacheService.invalidate('videos:public:')
    cacheService.invalidate('videos:count')
    console.log('🗑️ Invalidated video cache')
  },

  // Invalidate all model-related cache
  invalidateModels: () => {
    cacheService.invalidate('model:')
    cacheService.invalidate('homepage:')
    cacheService.invalidate('search:models:')
    console.log('🗑️ Invalidated model cache')
  },

  // Invalidate all category-related cache
  invalidateCategories: () => {
    cacheService.invalidate('homepage:categories')
    cacheService.invalidate('search:categories:')
    console.log('🗑️ Invalidated category cache')
  },

  // Invalidate homepage cache
  invalidateHomepage: () => {
    cacheService.invalidate('homepage:')
    console.log('🗑️ Invalidated homepage cache')
  },

  // Invalidate search cache
  invalidateSearch: () => {
    cacheService.invalidate('search:')
    console.log('🗑️ Invalidated search cache')
  },

  // Invalidate all cache
  invalidateAll: () => {
    cacheService.clear()
    console.log('🗑️ Cleared all cache')
  },

  // Smart invalidation based on operation type
  smartInvalidate: (operation: string, data?: any) => {
    switch (operation) {
      case 'video:create':
      case 'video:update':
      case 'video:delete':
        cacheInvalidation.invalidateVideos()
        break

      case 'model:create':
      case 'model:update':
      case 'model:delete':
        cacheInvalidation.invalidateModels()
        break

      case 'category:create':
      case 'category:update':
      case 'category:delete':
        cacheInvalidation.invalidateCategories()
        break

      case 'settings:update':
        // Settings already have their own cache invalidation in database.ts
        console.log('🗑️ Settings cache invalidated via database service')
        break

      case 'ad:create':
      case 'ad:update':
      case 'ad:delete':
        cacheService.invalidate('admin:')
        console.log('🗑️ Invalidated admin cache')
        break

      default:
        console.log(`⚠️ Unknown operation: ${operation}`)
    }
  }
}

// Auto-invalidation for database operations
export const setupCacheInvalidation = () => {
  // Listen for database changes and invalidate cache accordingly
  if (typeof window === 'undefined') {
    // Server-side: Set up database change listeners
    console.log('🔥 Cache invalidation system ready')
  }
}

export default cacheInvalidation
