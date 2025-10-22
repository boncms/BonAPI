import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'
import { Video, Category, Model } from '@/types'
import { cacheInvalidation } from './cache-invalidation'

// Database instance
const dbPath = path.join(process.cwd(), 'data', 'database.sqlite')
const db = new Database(dbPath)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('cache_size = 10000')
db.pragma('temp_store = MEMORY')

// Create tables if they don't exist
const initDatabase = () => {
  // Videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration TEXT NOT NULL,
      videoUrl TEXT NOT NULL,
      category TEXT NOT NULL,
      model TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0,
      uploadDate TEXT NOT NULL,
      tags TEXT,
      featured BOOLEAN DEFAULT 0,
      slug TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Admins table (for admin auth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      videoCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Models table
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      avatar TEXT,
      videoCount INTEGER DEFAULT 0,
      totalViews INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Ads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      css TEXT,
      js TEXT,
      position TEXT NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      startDate TEXT,
      endDate TEXT,
      clickCount INTEGER DEFAULT 0,
      impressionCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Custom Sections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      model TEXT,
      display_count INTEGER DEFAULT 15,
      theme_card TEXT DEFAULT 'premium',
      is_active BOOLEAN DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      icon TEXT,
      badge_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Refresh tokens table (for admin auth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      revoked INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // Attempt to backfill columns if an older schema exists
  try { db.exec('ALTER TABLE refresh_tokens ADD COLUMN id TEXT') } catch (e) {}
  try { db.exec('ALTER TABLE refresh_tokens ADD COLUMN admin_id INTEGER') } catch (e) {}
  try { db.exec('ALTER TABLE refresh_tokens ADD COLUMN revoked INTEGER DEFAULT 0') } catch (e) {}
  try { db.exec('ALTER TABLE refresh_tokens ADD COLUMN expires_at DATETIME') } catch (e) {}
  try { db.exec('ALTER TABLE refresh_tokens ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP') } catch (e) {}

  // Linking tables for many-to-many relations
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_categories (
      video_id INTEGER NOT NULL,
      category TEXT NOT NULL
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_models (
      video_id INTEGER NOT NULL,
      model TEXT NOT NULL
    )
  `)

  // Auto-scrape configs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auto_scrape_configs (
      id TEXT PRIMARY KEY,
      enabled BOOLEAN DEFAULT 1,
      interval_minutes INTEGER NOT NULL,
      type TEXT NOT NULL,
      start_page INTEGER NOT NULL,
      end_page INTEGER NOT NULL,
      keyword TEXT,
      update_existing BOOLEAN DEFAULT 0,
      last_run TEXT,
      next_run TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Attempt to add new columns if table exists without them
  try { db.exec('ALTER TABLE custom_sections ADD COLUMN icon TEXT') } catch (e) {}
  try { db.exec('ALTER TABLE custom_sections ADD COLUMN badge_text TEXT') } catch (e) {}
  try { db.exec('ALTER TABLE auto_scrape_configs ADD COLUMN update_existing BOOLEAN DEFAULT 0') } catch (e) {}

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
    CREATE INDEX IF NOT EXISTS idx_videos_model ON videos(model);
    CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views);
    CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(featured);
    CREATE INDEX IF NOT EXISTS idx_videos_uploadDate ON videos(uploadDate);
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position);
    CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(isActive);
    CREATE INDEX IF NOT EXISTS idx_video_categories_video ON video_categories(video_id);
    CREATE INDEX IF NOT EXISTS idx_video_categories_name ON video_categories(category);
    CREATE INDEX IF NOT EXISTS idx_video_models_video ON video_models(video_id);
    CREATE INDEX IF NOT EXISTS idx_video_models_name ON video_models(model);
  `)
}

// Initialize database
initDatabase()

// Prepared statements for better performance
const stmt = {
  // Videos
  getVideos: db.prepare('SELECT * FROM videos ORDER BY uploadDate DESC'),
  getVideoById: db.prepare('SELECT * FROM videos WHERE id = ?'),
  getVideoBySlug: db.prepare('SELECT * FROM videos WHERE slug = ?'),
  getVideoByTitle: db.prepare('SELECT * FROM videos WHERE title = ?'),
  getFeaturedVideos: db.prepare('SELECT * FROM videos WHERE featured = 1 ORDER BY uploadDate DESC'),
  // Use linking tables when available; fallback to text fields
  getVideosByCategory: db.prepare(`
    SELECT DISTINCT v.* FROM videos v
    LEFT JOIN video_categories vc ON vc.video_id = v.id AND vc.category = ?
    WHERE (vc.category IS NOT NULL OR v.category LIKE '%' || ? || '%')
    ORDER BY uploadDate DESC
  `),
  getVideosByModel: db.prepare(`
    SELECT DISTINCT v.* FROM videos v
    LEFT JOIN video_models vm ON vm.video_id = v.id AND vm.model = ?
    WHERE (vm.model IS NOT NULL OR v.model LIKE '%' || ? || '%')
    ORDER BY uploadDate DESC
  `),
  getMostViewedVideos: db.prepare('SELECT * FROM videos ORDER BY views DESC LIMIT ?'),
  getRandomVideos: db.prepare('SELECT * FROM videos ORDER BY RANDOM() LIMIT ?'),
  searchVideos: db.prepare(`
    SELECT * FROM videos 
    WHERE title LIKE ? OR model LIKE ? OR category LIKE ? OR tags LIKE ?
    ORDER BY uploadDate DESC
  `),
  insertVideo: db.prepare(`
    INSERT INTO videos (title, description, duration, videoUrl, thumbnail, category, model, views, likes, dislikes, uploadDate, tags, featured, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateVideo: db.prepare(`
    UPDATE videos 
    SET title = ?, description = ?, duration = ?, videoUrl = ?, thumbnail = ?, category = ?, model = ?, views = ?, likes = ?, dislikes = ?, tags = ?, featured = ?, slug = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteVideo: db.prepare('DELETE FROM videos WHERE id = ?'),
  // Link table operations
  insertVideoCategory: db.prepare('INSERT INTO video_categories (video_id, category) VALUES (?, ?)'),
  deleteVideoCategories: db.prepare('DELETE FROM video_categories WHERE video_id = ?'),
  insertVideoModel: db.prepare('INSERT INTO video_models (video_id, model) VALUES (?, ?)'),
  deleteVideoModels: db.prepare('DELETE FROM video_models WHERE video_id = ?'),
  incrementVideoViews: db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?'),

  // Categories
  getCategories: db.prepare('SELECT * FROM categories ORDER BY name'),
  getCategoryById: db.prepare('SELECT * FROM categories WHERE id = ?'),
  getCategoryByName: db.prepare('SELECT * FROM categories WHERE name = ?'),
  insertCategory: db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)'),
  updateCategory: db.prepare('UPDATE categories SET name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteCategory: db.prepare('DELETE FROM categories WHERE id = ?'),
  updateCategoryVideoCount: db.prepare('UPDATE categories SET videoCount = (SELECT COUNT(*) FROM videos WHERE category = categories.name)'),

  // Models
  getModels: db.prepare('SELECT * FROM models ORDER BY name'),
  getModelById: db.prepare('SELECT * FROM models WHERE id = ?'),
  getModelByName: db.prepare('SELECT * FROM models WHERE name = ?'),
  insertModel: db.prepare('INSERT INTO models (name, description, avatar) VALUES (?, ?, ?)'),
  updateModel: db.prepare('UPDATE models SET name = ?, description = ?, avatar = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'),
  deleteModel: db.prepare('DELETE FROM models WHERE id = ?'),
  updateModelStats: db.prepare(`
    UPDATE models SET 
      videoCount = (SELECT COUNT(*) FROM videos WHERE model = models.name),
      totalViews = (SELECT COALESCE(SUM(views), 0) FROM videos WHERE model = models.name)
  `),

  // Analytics prepared statements
  getVideosCount: db.prepare('SELECT COUNT(*) as count FROM videos'),
  getModelsCount: db.prepare('SELECT COUNT(*) as count FROM models'),
  getCategoriesCount: db.prepare('SELECT COUNT(*) as count FROM categories'),
  getAdsCount: db.prepare('SELECT COUNT(*) as count FROM ads WHERE isActive = 1'),
  getTotalViews: db.prepare('SELECT SUM(views) as totalViews FROM videos'),
  getTotalImpressions: db.prepare('SELECT SUM(impressionCount) as totalImpressions FROM ads'),
  getTotalClicks: db.prepare('SELECT SUM(clickCount) as totalClicks FROM ads'),

  // Settings
  getSettings: db.prepare('SELECT * FROM settings'),
  getSettingByKey: db.prepare('SELECT * FROM settings WHERE key = ?'),
  updateSetting: db.prepare(`
    UPDATE settings 
    SET value = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE key = ?
  `),
  insertSetting: db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, type, description)
    VALUES (?, ?, ?, ?)
  `),

  // Auto-scrape configs
  getAutoScrapeConfigs: db.prepare('SELECT * FROM auto_scrape_configs ORDER BY created_at DESC'),
  getAutoScrapeConfigById: db.prepare('SELECT * FROM auto_scrape_configs WHERE id = ?'),
  insertAutoScrapeConfig: db.prepare(`
    INSERT INTO auto_scrape_configs (id, enabled, interval_minutes, type, start_page, end_page, keyword, update_existing, last_run, next_run)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateAutoScrapeConfig: db.prepare(`
    UPDATE auto_scrape_configs 
    SET enabled = ?, interval_minutes = ?, type = ?, start_page = ?, end_page = ?, keyword = ?, update_existing = ?, last_run = ?, next_run = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteAutoScrapeConfig: db.prepare('DELETE FROM auto_scrape_configs WHERE id = ?')
  ,
  // Refresh tokens
  insertRefreshToken: db.prepare('INSERT INTO refresh_tokens (id, admin_id, expires_at) VALUES (?, ?, ?)'),
  getRefreshToken: db.prepare('SELECT * FROM refresh_tokens WHERE id = ? AND revoked = 0'),
  revokeTokensForAdmin: db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE admin_id = ? AND revoked = 0')
}

// Cache implementation
class Cache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl = this.TTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Clear cache by pattern
  clearPattern(pattern: string) {
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

const cache = new Cache()

// Helper function to safely parse tags
function parseTags(tags: string | null): string[] {
  if (!tags) return []
  
  try {
    // If it's already a JSON array, parse it
    if (tags.startsWith('[') && tags.endsWith(']')) {
      return JSON.parse(tags)
    }
    // If it's a single string, wrap it in an array
    return [tags]
  } catch (error) {
    // If parsing fails, treat as single string
    return [tags]
  }
}

// Database service with caching
export const dbService = {
  // expose raw db for API routes that need flexible queries
  db,
  async ensureDefaultAdmin(): Promise<void> {
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number }
    if (adminCount.count === 0) {
      const defaultUsername = process.env.XCMS_DEFAULT_ADMIN_USERNAME || 'admin'
      const defaultPassword = process.env.XCMS_DEFAULT_ADMIN_PASSWORD || 'admin123'
      const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex')
      db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(defaultUsername, passwordHash)
      
      // Log admin creation without exposing password
      console.log('🔐 Default admin created:', { username: defaultUsername })
    }
  },
  // Refresh tokens API (admin auth)
  async createRefreshToken(adminId: number, daysValid = 7): Promise<string> {
    const id = crypto.randomUUID()
    const expires = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)
    stmt.insertRefreshToken.run(id, adminId, expires.toISOString())
    return id
  },
  async getRefreshToken(id: string): Promise<{ id: string; admin_id: number; revoked: number; expires_at: string; created_at: string } | null> {
    const row = stmt.getRefreshToken.get(id) as any
    if (!row) return null
    // Expire if past due
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return null
    }
    return row
  },
  async revokeAllRefreshTokensForAdmin(adminId: number): Promise<void> {
    stmt.revokeTokensForAdmin.run(adminId)
  },
  // Videos - Full data (admin only)
  async getVideos(): Promise<Video[]> {
    const cacheKey = 'videos:all'
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getVideos.all() as any[]
      videos = rawVideos.map((video: any) => ({
        ...video,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }))
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  // Videos - Public data (no videoUrl) with pagination and caching
  async getVideosPublic(limit?: number, offset?: number): Promise<Omit<Video, 'videoUrl' | 'videoUrlType'>[]> {
    if (limit && offset !== undefined) {
      // Use cache for paginated results
      const cacheKey = `videos:public:${limit}:${offset}`
      let videos = cache.get(cacheKey)
      
      if (!videos) {
        // Direct pagination query - much faster
        const rawVideos = db.prepare(`
          SELECT id, title, description, duration, thumbnail, category, model, views, likes, dislikes, 
                 uploadDate, tags, featured, slug, createdAt, updatedAt
          FROM videos 
          ORDER BY uploadDate DESC 
          LIMIT ? OFFSET ?
        `).all(limit, offset) as any[]
        
        videos = rawVideos.map((video: any) => ({
          ...video,
          featured: Boolean(video.featured),
          tags: parseTags(video.tags)
        }))
        
        // Cache for 2 minutes
        cache.set(cacheKey, videos, 2 * 60 * 1000)
      }
      
      return videos
    }
    
    // Fallback to cached full list for compatibility
    const cacheKey = 'videos:public:all'
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getVideos.all() as any[]
      videos = rawVideos.map((video: any) => {
        const { videoUrl, videoUrlType, ...safeVideo } = video
        return {
          ...safeVideo,
          featured: Boolean(video.featured),
          tags: parseTags(video.tags)
        }
      })
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getVideoById(id: number): Promise<Video | null> {
    const cacheKey = `video:${id}`
    let video = cache.get(cacheKey)
    
    if (!video) {
      const rawVideo = stmt.getVideoById.get(id) as any
      if (rawVideo) {
        video = {
          ...rawVideo,
          featured: rawVideo.featured,
          tags: parseTags(rawVideo.tags)
        }
        cache.set(cacheKey, video)
      }
    }
    
    return video
  },

  async getVideoBySlug(slug: string): Promise<Video | null> {
    const cacheKey = `video:slug:${slug}`
    let video = cache.get(cacheKey)
    
    if (!video) {
      // 1) Try exact slug column
      const rawVideo = stmt.getVideoBySlug.get(slug) as any
      if (rawVideo) {
        video = {
          ...rawVideo,
          featured: Boolean(rawVideo.featured),
          tags: rawVideo.tags ? JSON.parse(rawVideo.tags) : []
        }
      } else {
        // 2) Fallback: match slugified title
        const rawVideos = stmt.getVideos.all() as any[]
        const videos = rawVideos.map((v: any) => ({
          ...v,
          featured: Boolean(v.featured),
          tags: v.tags ? JSON.parse(v.tags) : []
        }))
        video = videos.find((v: Video) => 
          v.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') === slug
        ) || null
      }
      if (video) cache.set(cacheKey, video)
    }
    
    return video
  },

  async getVideoByTitle(title: string): Promise<Video | null> {
    const cacheKey = `video:title:${title}`
    let video = cache.get(cacheKey)
    
    if (!video) {
      video = stmt.getVideoByTitle.get(title) as any
      if (video) {
        video = {
          ...video,
          featured: Boolean(video.featured),
          tags: parseTags(video.tags)
        }
        cache.set(cacheKey, video)
      }
    }
    
    return video
  },

  async getFeaturedVideos(): Promise<Video[]> {
    const cacheKey = 'videos:featured'
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getFeaturedVideos.all() as any[]
      videos = rawVideos.map((video: any) => ({
        ...video,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }))
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getVideosByCategory(category: string): Promise<Video[]> {
    const cacheKey = `videos:category:${category}`
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getVideosByCategory.all(category, category) as any[]
      videos = rawVideos.map((video: any) => ({
        ...video,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }))
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getVideosByCategoryPublic(category: string): Promise<Omit<Video, 'videoUrl' | 'videoUrlType'>[]> {
    const cacheKey = `videos:category:public:${category}`
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getVideosByCategory.all(category, category) as any[]
      videos = rawVideos.map((video: any) => {
        const { videoUrl, videoUrlType, ...safeVideo } = video
        return {
          ...safeVideo,
          featured: Boolean(video.featured),
          tags: parseTags(video.tags)
        }
      })
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getVideosByModel(model: string): Promise<Video[]> {
    const cacheKey = `videos:model:${model}`
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getVideosByModel.all(model, model) as any[]
      videos = rawVideos.map((video: any) => ({
        ...video,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }))
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getVideosByModelPublic(model: string): Promise<Omit<Video, 'videoUrl' | 'videoUrlType'>[]> {
    const cacheKey = `videos:model:public:${model}`
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getVideosByModel.all(model, model) as any[]
      videos = rawVideos.map((video: any) => {
        const { videoUrl, videoUrlType, ...safeVideo } = video
        return {
          ...safeVideo,
          featured: Boolean(video.featured),
          tags: parseTags(video.tags)
        }
      })
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getVideosWithFilters(filters: {
    categories?: string[]
    models?: string[]
    sortBy?: string
    dateRange?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<Omit<Video, 'videoUrl' | 'videoUrlType'>[]> {
    let query = 'SELECT * FROM videos WHERE 1=1'
    const params: any[] = []

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      const categoryConditions = filters.categories.map(() => '(category LIKE ? OR category LIKE ?)').join(' OR ')
      query += ` AND (${categoryConditions})`
      filters.categories.forEach(category => {
        params.push(`%${category}%`, `%,${category},%`)
      })
    }

    // Model filter
    if (filters.models && filters.models.length > 0) {
      const modelConditions = filters.models.map(() => '(model LIKE ? OR model LIKE ?)').join(' OR ')
      query += ` AND (${modelConditions})`
      filters.models.forEach(model => {
        params.push(`%${model}%`, `%,${model},%`)
      })
    }

    // Search filter
    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)'
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      let dateCondition = ''
      
      switch (filters.dateRange) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateCondition = 'uploadDate >= ?'
          params.push(today.toISOString())
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          dateCondition = 'uploadDate >= ?'
          params.push(weekAgo.toISOString())
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          dateCondition = 'uploadDate >= ?'
          params.push(monthAgo.toISOString())
          break
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          dateCondition = 'uploadDate >= ?'
          params.push(yearAgo.toISOString())
          break
      }
      
      if (dateCondition) {
        query += ` AND ${dateCondition}`
      }
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        query += ' ORDER BY uploadDate ASC'
        break
      case 'most_viewed':
        query += ' ORDER BY views DESC'
        break
      case 'most_liked':
        query += ' ORDER BY likes DESC'
        break
      case 'newest':
      default:
        query += ' ORDER BY uploadDate DESC'
        break
    }

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit
      query += ` LIMIT ${filters.limit} OFFSET ${offset}`
    }

    const rawVideos = db.prepare(query).all(...params) as any[]
    
    return rawVideos.map((video: any) => {
      const { videoUrl, videoUrlType, ...safeVideo } = video
      return {
        ...safeVideo,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }
    })
  },

  async getMostViewedVideos(limit = 10): Promise<Video[]> {
    const cacheKey = `videos:mostViewed:${limit}`
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getMostViewedVideos.all(limit) as any[]
      videos = rawVideos.map((video: any) => ({
        ...video,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }))
      cache.set(cacheKey, videos)
    }
    
    return videos
  },

  async getRandomVideos(limit = 10): Promise<Video[]> {
    const cacheKey = `videos:random:${limit}`
    let videos = cache.get(cacheKey)
    
    if (!videos) {
      const rawVideos = stmt.getRandomVideos.all(limit) as any[]
      videos = rawVideos.map((video: any) => ({
        ...video,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }))
      cache.set(cacheKey, videos, 60000) // 1 minute cache for random videos
    }
    
    return videos
  },

  async searchVideos(query: string): Promise<Video[]> {
    const searchTerm = `%${query}%`
    const rawVideos = stmt.searchVideos.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[]
    return rawVideos.map((video: any) => ({
      ...video,
          featured: Boolean(video.featured),
      tags: parseTags(video.tags)
    }))
  },

  async searchVideosPublic(query: string): Promise<Omit<Video, 'videoUrl' | 'videoUrlType'>[]> {
    const searchTerm = `%${query}%`
    const rawVideos = stmt.searchVideos.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[]
    return rawVideos.map((video: any) => {
      const { videoUrl, videoUrlType, ...safeVideo } = video
      return {
        ...safeVideo,
        featured: Boolean(video.featured),
        tags: parseTags(video.tags)
      }
    })
  },

  async createVideo(video: Omit<Video, 'id'>): Promise<Video> {
    const result = stmt.insertVideo.run(
      video.title,
      video.description || '',
      video.duration,
      video.videoUrl,
      video.thumbnail || '',
      video.category,
      video.model,
      video.views || 0,
      video.likes || 0,
      video.dislikes || 0,
      video.uploadDate,
      video.tags?.join(', ') || '',
      video.featured ? 1 : 0,
      video.slug || ''
    )
    
    const newVideo = { ...video, id: result.lastInsertRowid as number }
    
    // Invalidate cache
    cacheInvalidation.smartInvalidate('video:create', newVideo)
    
    return newVideo
  },

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | null> {
    const existing = await this.getVideoById(id)
    if (!existing) return null

    const updated = { ...existing, ...video }
    stmt.updateVideo.run(
      updated.title,
      updated.description || '',
      updated.duration,
      updated.videoUrl,
      updated.thumbnail || '',
      updated.category,
      updated.model,
      updated.views || 0,
      updated.likes || 0,
      updated.dislikes || 0,
      updated.tags ? (Array.isArray(updated.tags) ? updated.tags.join(', ') : updated.tags) : '',
      updated.featured ? 1 : 0,
      updated.slug || '',
      id
    )
    
    // Invalidate cache
    cacheInvalidation.smartInvalidate('video:update', updated)
    
    return updated
  },

  async deleteVideo(id: number): Promise<boolean> {
    const result = stmt.deleteVideo.run(id)
    
    if (result.changes > 0) {
      // Invalidate cache
      cacheInvalidation.smartInvalidate('video:delete', { id })
      return true
    }
    
    return false
  },

  async incrementVideoViews(id: number): Promise<void> {
    stmt.incrementVideoViews.run(id)
    // Invalidate video views cache
    cacheInvalidation.invalidateVideos()
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories:all'
    let categories = cache.get(cacheKey)
    
    if (!categories) {
      categories = stmt.getCategories.all()
      cache.set(cacheKey, categories)
    }
    
    return categories
  },

  async getCategoriesPaginated(limit: number, offset: number, search: string = ''): Promise<{categories: Category[], total: number, totalPages: number}> {
    try {
      // Get total count with search filter
      let countQuery = 'SELECT COUNT(*) as total FROM categories'
      let countParams: any[] = []
      
      if (search) {
        countQuery += ' WHERE name LIKE ? OR description LIKE ?'
        countParams = [`%${search}%`, `%${search}%`]
      }
      
      const countResult = db.prepare(countQuery).get(...countParams) as {total: number}
      const total = countResult.total
      const totalPages = Math.ceil(total / limit)
      
      // Get paginated results with search filter
      let dataQuery = 'SELECT * FROM categories'
      let dataParams: any[] = []
      
      if (search) {
        dataQuery += ' WHERE name LIKE ? OR description LIKE ?'
        dataParams = [`%${search}%`, `%${search}%`]
      }
      
      dataQuery += ' ORDER BY name LIMIT ? OFFSET ?'
      dataParams.push(limit, offset)
      
      const categories = db.prepare(dataQuery).all(...dataParams) as Category[]
      
      // Calculate actual video count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          try {
            const videoCountResult = db.prepare(
              'SELECT COUNT(*) as count FROM videos WHERE category = ?'
            ).get(category.name) as {count: number}
            
            return {
              ...category,
              videoCount: videoCountResult.count
            }
          } catch (error) {
            console.error(`Error counting videos for category ${category.name}:`, error)
            return {
              ...category,
              videoCount: 0
            }
          }
        })
      )
      
      return {
        categories: categoriesWithCount,
        total,
        totalPages
      }
    } catch (error) {
      console.error('Error in getCategoriesPaginated:', error)
      return {
        categories: [],
        total: 0,
        totalPages: 0
      }
    }
  },

  async getCategoryById(id: number): Promise<Category | null> {
    const cacheKey = `category:${id}`
    let category = cache.get(cacheKey)
    
    if (!category) {
      category = stmt.getCategoryById.get(id)
      if (category) cache.set(cacheKey, category)
    }
    
    return category
  },

  async getCategoryByName(name: string): Promise<Category | null> {
    const cacheKey = `category:name:${name}`
    let category = cache.get(cacheKey)
    
    if (!category) {
      category = stmt.getCategoryByName.get(name)
      if (category) cache.set(cacheKey, category)
    }
    
    return category
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const result = stmt.insertCategory.run(
      category.name,
      category.description || ''
    )
    
    const newCategory = { ...category, id: result.lastInsertRowid as number }
    
    // Clear cache
    cache.clearPattern('categories:')
    
    return newCategory
  },

  async updateCategory(id: number, category: Partial<Category>): Promise<Category | null> {
    const existing = await this.getCategoryById(id)
    if (!existing) return null

    const updated = { ...existing, ...category }
    stmt.updateCategory.run(
      updated.name,
      updated.description || '',
      id
    )
    
    // Clear cache
    cache.clearPattern('categories:')
    cache.delete(`category:${id}`)
    
    return updated
  },

  async deleteCategory(id: number): Promise<boolean> {
    const result = stmt.deleteCategory.run(id)
    
    if (result.changes > 0) {
      cache.clearPattern('categories:')
      cache.delete(`category:${id}`)
      return true
    }
    
    return false
  },

  // Models
  async getModels(): Promise<Model[]> {
    const cacheKey = 'models:all'
    let models = cache.get(cacheKey)
    
    if (!models) {
      models = stmt.getModels.all()
      cache.set(cacheKey, models)
    }
    
    return models
  },

  async getModelsPaginated(limit: number, offset: number, search: string = '', sortBy: string = 'alphabetical'): Promise<{models: Model[], total: number, totalPages: number}> {
    try {
      // Get total count with search filter
      let countQuery = 'SELECT COUNT(*) as total FROM models'
      let countParams: any[] = []
      
      if (search) {
        countQuery += ' WHERE name LIKE ? OR description LIKE ?'
        countParams = [`%${search}%`, `%${search}%`]
      }
      
      const countResult = db.prepare(countQuery).get(...countParams) as {total: number}
      const total = countResult.total
      const totalPages = Math.ceil(total / limit)
      
      // Get paginated results with search filter
      let dataQuery = 'SELECT * FROM models'
      let dataParams: any[] = []
      
      if (search) {
        dataQuery += ' WHERE name LIKE ? OR description LIKE ?'
        dataParams = [`%${search}%`, `%${search}%`]
      }
      
      // Add sorting
      switch (sortBy) {
        case 'alphabetical':
          dataQuery += ' ORDER BY name ASC'
          break
        case 'newest':
          dataQuery += ' ORDER BY id DESC'
          break
        case 'viewed':
          dataQuery += ' ORDER BY totalViews DESC'
          break
        default:
          dataQuery += ' ORDER BY name ASC'
          break
      }
      
      dataQuery += ' LIMIT ? OFFSET ?'
      dataParams.push(limit, offset)
      
      const models = db.prepare(dataQuery).all(...dataParams) as Model[]
      
      return {
        models,
        total,
        totalPages
      }
    } catch (error) {
      console.error('Error in getModelsPaginated:', error)
      return {
        models: [],
        total: 0,
        totalPages: 0
      }
    }
  },

  async getModelById(id: number): Promise<Model | null> {
    const cacheKey = `model:${id}`
    let model = cache.get(cacheKey)
    
    if (!model) {
      model = stmt.getModelById.get(id)
      if (model) cache.set(cacheKey, model)
    }
    
    return model
  },

  async getModelByName(name: string): Promise<Model | null> {
    const cacheKey = `model:name:${name}`
    let model = cache.get(cacheKey)
    
    if (!model) {
      model = stmt.getModelByName.get(name)
      if (model) cache.set(cacheKey, model)
    }
    
    return model
  },

  async createModel(model: Omit<Model, 'id'>): Promise<Model> {
    const result = stmt.insertModel.run(
      model.name,
      model.description || '',
      model.avatar || ''
    )
    
    const newModel = { ...model, id: result.lastInsertRowid as number }
    
    // Clear cache
    cache.clearPattern('models:')
    
    return newModel
  },

  async updateModel(id: number, model: Partial<Model>): Promise<Model | null> {
    const existing = await this.getModelById(id)
    if (!existing) return null

    const updated = { ...existing, ...model }
    stmt.updateModel.run(
      updated.name,
      updated.description || '',
      updated.avatar || '',
      id
    )
    
    // Clear cache
    cache.clearPattern('models:')
    cache.delete(`model:${id}`)
    
    return updated
  },

  async deleteModel(id: number): Promise<boolean> {
    const result = stmt.deleteModel.run(id)
    
    if (result.changes > 0) {
      cache.clearPattern('models:')
      cache.delete(`model:${id}`)
      return true
    }
    
    return false
  },

  // Settings
  async getSettings(): Promise<Record<string, any>> {
    const cacheKey = 'settings:all'
    let settings = cache.get(cacheKey)

    if (!settings) {
      const settingsList = stmt.getSettings.all() as any[]
      settings = settingsList.reduce((acc, setting) => {
        let value = setting.value
        if (setting.type === 'boolean') {
          value = value === 'true'
        } else if (setting.type === 'number') {
          value = parseFloat(value)
        }
        acc[setting.key] = value
        return acc
      }, {})
      cache.set(cacheKey, settings)
    }

    return settings
  },

  async getSetting(key: string): Promise<any> {
    const cacheKey = `setting:${key}`
    let setting = cache.get(cacheKey)

    if (!setting) {
      const result = stmt.getSettingByKey.get(key) as any
      if (result) {
        let value = result.value
        if (result.type === 'boolean') {
          value = value === 'true'
        } else if (result.type === 'number') {
          value = parseFloat(value)
        }
        setting = value
        cache.set(cacheKey, setting)
      }
    }

    return setting
  },

  async updateSetting(key: string, value: any): Promise<void> {
    const stringValue = typeof value === 'boolean' ? value.toString() : String(value)
    stmt.updateSetting.run(stringValue, key)
    cache.delete(`setting:${key}`)
    cache.delete('settings:all')
  },
  async upsertSetting(key: string, value: any): Promise<void> {
    const stringValue = typeof value === 'boolean' ? value.toString() : String(value)
    stmt.insertSetting.run(key, stringValue, typeof value, null)
    cache.delete(`setting:${key}`)
    cache.delete('settings:all')
  },

  async updateSettings(settings: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.updateSetting(key, value)
    }
  },

  // Auto-scrape configs
  async getAutoScrapeConfigs(): Promise<any[]> {
    const cacheKey = 'auto_scrape_configs:all'
    let configs = cache.get(cacheKey)
    
    if (!configs) {
      configs = stmt.getAutoScrapeConfigs.all()
      cache.set(cacheKey, configs)
    }
    
    return configs
  },

  async getAutoScrapeConfigById(id: string): Promise<any | null> {
    const cacheKey = `auto_scrape_config:${id}`
    let config = cache.get(cacheKey)
    
    if (!config) {
      config = stmt.getAutoScrapeConfigById.get(id)
      if (config) {
        cache.set(cacheKey, config)
      }
    }
    
    return config
  },

  async createAutoScrapeConfig(config: any): Promise<any> {
    const result = stmt.insertAutoScrapeConfig.run(
      config.id,
      config.enabled ? 1 : 0,
      config.interval,
      config.type,
      config.startPage,
      config.endPage,
      config.keyword || null,
      config.updateExisting ? 1 : 0,
      config.lastRun || null,
      config.nextRun || null
    )
    
    const newConfig = { ...config, id: result.lastInsertRowid as number }
    
    // Clear cache
    cache.clearPattern('auto_scrape_configs:')
    
    return newConfig
  },

  async updateAutoScrapeConfig(id: string, config: any): Promise<any | null> {
    const result = stmt.updateAutoScrapeConfig.run(
      config.enabled ? 1 : 0,
      config.interval,
      config.type,
      config.startPage,
      config.endPage,
      config.keyword || null,
      config.updateExisting ? 1 : 0,
      config.lastRun || null,
      config.nextRun || null,
      id
    )
    
    if (result.changes === 0) return null
    
    const updatedConfig = { ...config, id }
    
    // Clear cache
    cache.clearPattern('auto_scrape_configs:')
    cache.delete(`auto_scrape_config:${id}`)
    
    return updatedConfig
  },

  async deleteAutoScrapeConfig(id: string): Promise<boolean> {
    const result = stmt.deleteAutoScrapeConfig.run(id)
    
    // Clear cache
    cache.clearPattern('auto_scrape_configs:')
    cache.delete(`auto_scrape_config:${id}`)
    
    return result.changes > 0
  },

  // Utility functions
  async updateStats(): Promise<void> {
    // Update category video counts
    stmt.updateCategoryVideoCount.run()
    
    // Update model stats
    stmt.updateModelStats.run()
    
    // Clear all caches
    cache.clear()
  },

  // Analytics methods
  async getVideosCount() {
    try {
      const result = stmt.getVideosCount.get() as { count: number } | undefined
      return result?.count || 0
    } catch (error) {
      console.error('Error getting videos count:', error)
      return 0
    }
  },

  async getModelsCount() {
    try {
      const result = stmt.getModelsCount.get() as { count: number } | undefined
      return result?.count || 0
    } catch (error) {
      console.error('Error getting models count:', error)
      return 0
    }
  },

  async getCategoriesCount() {
    try {
      const result = stmt.getCategoriesCount.get() as { count: number } | undefined
      return result?.count || 0
    } catch (error) {
      console.error('Error getting categories count:', error)
      return 0
    }
  },

  async getAdsCount() {
    try {
      const result = stmt.getAdsCount.get() as { count: number } | undefined
      return result?.count || 0
    } catch (error) {
      console.error('Error getting ads count:', error)
      return 0
    }
  },

  async getTotalViews() {
    try {
      const result = stmt.getTotalViews.get() as { totalViews: number } | undefined
      return result?.totalViews || 0
    } catch (error) {
      console.error('Error getting total views:', error)
      return 0
    }
  },

  async getTotalImpressions() {
    try {
      const result = stmt.getTotalImpressions.get() as { totalImpressions: number } | undefined
      return result?.totalImpressions || 0
    } catch (error) {
      console.error('Error getting total impressions:', error)
      return 0
    }
  },

  async getTotalClicks() {
    try {
      const result = stmt.getTotalClicks.get() as { totalClicks: number } | undefined
      return result?.totalClicks || 0
    } catch (error) {
      console.error('Error getting total clicks:', error)
      return 0
    }
  },

  // Auth helpers
  async verifyAdminCredentials(username: string, password: string): Promise<{ id: number; username: string } | null> {
    const row = db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username) as any
    if (!row) return null
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    if (hash !== row.password_hash) return null
    return { id: row.id, username: row.username }
  },
  async revokeRefreshToken(id: string): Promise<void> {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(id)
  },

  // Custom Sections methods
  async getCustomSections(activeOnly: boolean = false): Promise<any[]> {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM custom_sections WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC'
        : 'SELECT * FROM custom_sections ORDER BY sort_order ASC, created_at ASC'
      
      const sections = db.prepare(query).all()
      return sections
    } catch (error) {
      console.error('Error getting custom sections:', error)
      return []
    }
  },

  async createCustomSection(sectionData: any): Promise<any> {
    try {
      const { name, category, model, display_count, theme_card, is_active, sort_order, icon, badge_text } = sectionData
      
      const result = db.prepare(`
        INSERT INTO custom_sections (name, category, model, display_count, theme_card, is_active, sort_order, icon, badge_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, category || '', model || '', display_count || 15, theme_card || 'premium', is_active !== false ? 1 : 0, sort_order || 0, icon || '', badge_text || null)
      
      return {
        id: result.lastInsertRowid,
        name,
        category,
        model,
        display_count: display_count || 15,
        theme_card: theme_card || 'premium',
        is_active: is_active !== false,
        sort_order: sort_order || 0,
        icon: icon || '',
        badge_text: badge_text || null
      }
    } catch (error) {
      console.error('Error creating custom section:', error)
      throw error
    }
  },

  async updateCustomSection(id: number, sectionData: any): Promise<any> {
    try {
      const { name, category, model, display_count, theme_card, is_active, sort_order, icon, badge_text } = sectionData
      
      const result = db.prepare(`
        UPDATE custom_sections 
        SET name = ?, category = ?, model = ?, display_count = ?, theme_card = ?, is_active = ?, sort_order = ?, icon = ?, badge_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, category || '', model || '', display_count || 15, theme_card || 'premium', is_active !== false ? 1 : 0, sort_order || 0, icon || '', badge_text || null, id)
      
      if (result.changes === 0) {
        return null
      }
      
      return db.prepare('SELECT * FROM custom_sections WHERE id = ?').get(id)
    } catch (error) {
      console.error('Error updating custom section:', error)
      throw error
    }
  },

  async deleteCustomSection(id: number): Promise<boolean> {
    try {
      const result = db.prepare('DELETE FROM custom_sections WHERE id = ?').run(id)
      return result.changes > 0
    } catch (error) {
      console.error('Error deleting custom section:', error)
      throw error
    }
  }
}

export default dbService

// Export cache for API use
export { cache }
