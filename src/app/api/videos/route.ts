import { NextRequest, NextResponse } from 'next/server'
import dbService, { cache } from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'
import { createApiResponse, createErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const model = searchParams.get('model')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // New filter parameters
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const models = searchParams.get('models')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'newest'
    const dateRange = searchParams.get('dateRange') || 'all'

    let videos
    let total = 0

    // Check if we have new filter parameters
    const hasNewFilters = categories.length > 0 || models.length > 0 || sortBy !== 'newest' || dateRange !== 'all'
    
    if (hasNewFilters) {
      // Use new filtering system
      videos = await dbService.getVideosWithFilters({
        categories,
        models,
        sortBy,
        dateRange,
        search: search || undefined,
        page,
        limit
      })
      total = videos.length
    } else if (category && category !== 'All') {
      videos = await dbService.getVideosByCategoryPublic(category)
      total = videos.length
    } else if (model) {
      videos = await dbService.getVideosByModelPublic(model)
      total = videos.length
    } else if (search) {
      videos = await dbService.searchVideosPublic(search)
      total = videos.length
    } else {
      // Use efficient pagination for main videos list
      const startIndex = offset > 0 ? offset : (page - 1) * limit
      videos = await dbService.getVideosPublic(limit, startIndex)
      
      // Get total count efficiently with cache
      const countCacheKey = 'videos:count'
      let cachedCount = cache.get(countCacheKey)
      
      if (cachedCount === null) {
        const countResult = dbService.db.prepare('SELECT COUNT(*) as count FROM videos').get() as { count: number }
        total = countResult.count
        // Cache count for 5 minutes
        cache.set(countCacheKey, total, 5 * 60 * 1000)
      } else {
        total = cachedCount
      }
    }

    // Sort only if not using direct pagination or new filters
    if ((category || model || search) && !hasNewFilters) {
      switch (sort) {
        case 'viewed':
          videos.sort((a, b) => b.views - a.views)
          break
        case 'rated':
          videos.sort((a, b) => b.likes - a.likes)
          break
        case 'recent':
        default:
          videos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
          break
      }

      // Pagination for filtered results
      const startIndex = offset > 0 ? offset : (page - 1) * limit
      const endIndex = startIndex + limit
      videos = videos.slice(startIndex, endIndex)
    }

    safeLog('📹 Public videos fetched', { 
      count: videos.length, 
      total: total,
      filters: { category, model, search, sort },
      pagination: { page, limit, offset }
    })

    return createApiResponse({
      success: true,
      videos: videos,
      total: total,
      totalPages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    safeError('Error fetching videos', error)
    return createErrorResponse('Failed to fetch videos', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const video = await request.json()
    const newVideo = await dbService.createVideo(video)
    return createApiResponse(newVideo, 201)
  } catch (error) {
    console.error('Error creating video:', error)
    return createErrorResponse('Failed to create video', 500)
  }
}
