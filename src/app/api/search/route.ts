import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'
import { cacheService } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'videos'
    
    if (!query) {
      return NextResponse.json([])
    }
    
    if (type === 'videos') {
      const cacheKey = `search:videos:${query.toLowerCase()}`
      const videos = await cacheService.getOrSet(cacheKey, () => dbService.searchVideosPublic(query))
      
      return NextResponse.json(videos)
    }
    
    if (type === 'models') {
      const cacheKey = `search:models:${query.toLowerCase()}`
      const models = await cacheService.getOrSet(cacheKey, () => dbService.getModels())
      const filteredModels = models.filter(model => 
        model.name.toLowerCase().includes(query.toLowerCase()) ||
        model.description?.toLowerCase().includes(query.toLowerCase())
      )
      return NextResponse.json(filteredModels)
    }
    
    if (type === 'categories') {
      const cacheKey = `search:categories:${query.toLowerCase()}`
      const categories = await cacheService.getOrSet(cacheKey, () => dbService.getCategories())
      const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(query.toLowerCase()) ||
        category.description?.toLowerCase().includes(query.toLowerCase())
      )
      return NextResponse.json(filteredCategories)
    }
    
    return NextResponse.json([])
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
