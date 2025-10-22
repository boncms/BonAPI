export interface Video {
  id: number
  title: string
  description?: string
  duration: string
  thumbnail?: string
  videoUrl: string
  videoUrlType?: 'embed' | 'm3u8' | 'mp4'
  views: number
  likes: number
  dislikes: number
  uploadDate: string
  category: string
  model: string
  tags: string[]
  featured: boolean
  slug?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  videoCount: number
}

export interface Model {
  id: number
  name: string
  description?: string
  avatar?: string
  videoCount: number
  totalViews: number
}

export interface Comment {
  id: number
  author: string
  content: string
  createdAt: string
  videoId: number
}

export interface Ad {
  id: number
  title: string
  description?: string
  content: string // HTML content
  css?: string // Custom CSS
  js?: string // Custom JavaScript
  position: 'top' | 'sidebar' | 'bottom' | 'inline' | 'popup'
  isActive: boolean
  startDate?: string
  endDate?: string
  clickCount: number
  impressionCount: number
  createdAt: string
  updatedAt: string
}
