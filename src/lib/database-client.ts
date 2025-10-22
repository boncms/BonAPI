// Client-side database service that uses API calls instead of direct SQLite
import { Video, Category, Model } from '@/types'

class DatabaseClient {
  private baseUrl = '/api'

  // Videos - Load all videos efficiently with cache
  async getVideos(): Promise<Video[]> {
    // Use cached version for better performance
    const response = await fetch(`${this.baseUrl}/videos?limit=2000`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    const data = await response.json()
    return data.videos || []
  }

  // Paginated version for specific use cases
  async getVideosPaginated(page = 1, limit = 20, filters: any = {}): Promise<{ videos: Video[], total: number, totalPages: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    // Add filter parameters
    if (filters.search) params.set('search', filters.search)
    if (filters.categories?.length) params.set('categories', filters.categories.join(','))
    if (filters.models?.length) params.set('models', filters.models.join(','))
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.dateRange) params.set('dateRange', filters.dateRange)

    const response = await fetch(`${this.baseUrl}/videos?${params.toString()}`)
    const data = await response.json()
    return {
      videos: data.videos || [],
      total: data.total || 0,
      totalPages: data.totalPages || 0
    }
  }

  async getVideoById(id: number): Promise<Video | null> {
    const response = await fetch(`${this.baseUrl}/videos/${id}`)
    if (!response.ok) return null
    return response.json()
  }

  async getVideoBySlug(slug: string): Promise<Video | null> {
    const response = await fetch(`${this.baseUrl}/videos/slug/${encodeURIComponent(slug)}`)
    if (!response.ok) return null
    const data = await response.json()
    return data?.video || null
  }

  async getFeaturedVideos(): Promise<Video[]> {
    // Don't use cache for featured videos to ensure fresh data
    const response = await fetch(`${this.baseUrl}/videos?limit=2000`, {
      cache: 'no-store' // Always fetch fresh data
    })
    const data = await response.json()
    const videos = data.videos || []
    return videos.filter((v: Video) => v.featured)
  }

  async getVideosByCategory(category: string): Promise<Video[]> {
    const response = await fetch(`${this.baseUrl}/videos?category=${encodeURIComponent(category)}`)
    const data = await response.json()
    return data.videos || data
  }

  async getVideosByModel(model: string): Promise<Video[]> {
    const response = await fetch(`${this.baseUrl}/videos?model=${encodeURIComponent(model)}`)
    const data = await response.json()
    return data.videos || data
  }

  async getMostViewedVideos(limit = 10): Promise<Video[]> {
    const videos = await this.getVideos()
    return videos.sort((a: Video, b: Video) => b.views - a.views).slice(0, limit)
  }

  async getRandomVideos(limit = 10): Promise<Video[]> {
    const videos = await this.getVideos()
    const shuffled = [...videos].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, limit)
  }

  async getVideosOnlyfans(limit: number): Promise<Video[]> {
    const videos = await this.getVideos()
    return videos.filter((v: Video) => (v.category || '').toLowerCase().includes('onlyfans')).slice(0, limit)
  }

  async getHotWeekly(limit: number): Promise<Video[]> {
    const videos = await this.getVideos()
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const inWeek = videos.filter((v: Video) => {
      const t = new Date(v.uploadDate as string).getTime()
      return !isNaN(t) && t >= oneWeekAgo
    })
    return inWeek.sort((a: Video, b: Video) => b.views - a.views).slice(0, limit)
  }

  async getCategoriesWithViews(): Promise<{ name: string; totalViews: number; videoCount: number }[]> {
    // Get ALL videos (not limited to 20) for category aggregation
    const response = await fetch(`${this.baseUrl}/videos?limit=10000`) // Get all videos
    const data = await response.json()
    const videos = data.success ? data.videos : []
    
    const map = new Map<string, { totalViews: number; videoCount: number }>()
    for (const v of videos as Video[]) {
      const raw = String(v.category || '')
      if (!raw) continue
      const tokens = raw.split(',').map((s: string) => s.trim()).filter(Boolean)
      if (tokens.length === 0) continue
      for (const token of tokens) {
        const cur = map.get(token) || { totalViews: 0, videoCount: 0 }
        cur.totalViews += v.views || 0
        cur.videoCount += 1
        map.set(token, cur)
      }
    }
    return Array.from(map.entries()).map(([name, agg]) => ({ name, ...agg }))
  }

  async searchVideos(query: string): Promise<Video[]> {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=videos`)
    return response.json()
  }

  async createVideo(video: Omit<Video, 'id'>): Promise<Video> {
    const response = await fetch(`${this.baseUrl}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    })
    return response.json()
  }

  async updateVideo(id: number, video: Partial<Video>): Promise<Video | null> {
    const response = await fetch(`${this.baseUrl}/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    })
    if (!response.ok) return null
    return response.json()
  }

  async deleteVideo(id: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/videos/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  }

  async incrementVideoViews(id: number): Promise<void> {
    await fetch(`${this.baseUrl}/videos/${id}/views`, {
      method: 'POST'
    })
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${this.baseUrl}/categories`)
    const data = await response.json()
    return data.categories || data || []
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const categories = await this.getCategories()
    return categories.find(c => c.id === id) || null
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    const categories = await this.getCategories()
    return categories.find(c => c.name === name) || null
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const response = await fetch(`${this.baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    })
    return response.json()
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category | null> {
    const response = await fetch(`${this.baseUrl}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    })
    if (!response.ok) return null
    return response.json()
  }

  async deleteCategory(id: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/categories/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  }

  // Models
  async getModels(): Promise<Model[]> {
    // Fetch all models by paginating the API
    const pageSize = 200
    let offset = 0
    const all: Model[] = []
    while (true) {
      const res = await fetch(`${this.baseUrl}/models?limit=${pageSize}&offset=${offset}`)
      if (!res.ok) break
      const data = await res.json()
      const batch: Model[] = data.models || []
      all.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    }
    return all
  }

  async getModelById(id: number): Promise<Model | null> {
    const models = await this.getModels()
    return models.find(m => m.id === id) || null
  }

  async getModelByName(name: string): Promise<Model | null> {
    const models = await this.getModels()
    return models.find(m => m.name === name) || null
  }

  async createModel(model: Omit<Model, 'id'>): Promise<Model> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    })
    return response.json()
  }

  async updateModel(id: number, model: Partial<Model>): Promise<Model | null> {
    const response = await fetch(`${this.baseUrl}/models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    })
    if (!response.ok) return null
    return response.json()
  }

  async deleteModel(id: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/models/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  }

  // Custom Sections
  async getCustomSections(activeOnly: boolean = false): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/custom-sections?active=${activeOnly}`)
    const data = await response.json()
    return data.sections || []
  }

  // Utility functions
  async updateStats(): Promise<void> {
    // This would typically be called on the server side
  }
}

const databaseClient = new DatabaseClient()
export default databaseClient
