import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/videos - Get full video data (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const token = request.headers.get('authorization')
    // if (!isValidAdminToken(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const model = searchParams.get('model')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const sort = searchParams.get('sort') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let videos

    // Get videos based on filters
    if (category && category !== 'All') {
      videos = await dbService.getVideosByCategory(category)
    } else if (model) {
      videos = await dbService.getVideosByModel(model)
    } else if (search) {
      videos = await dbService.searchVideos(search)
    } else {
      videos = await dbService.getVideos()
    }

    // Apply featured filter
    if (featured === 'featured') {
      videos = videos.filter(video => Boolean(video.featured))
    } else if (featured === 'not-featured') {
      videos = videos.filter(video => !Boolean(video.featured))
    }

    // Sort
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

    // Pagination - use offset if provided, otherwise use page
    const startIndex = offset > 0 ? offset : (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedVideos = videos.slice(startIndex, endIndex)

    safeLog('🔐 Admin videos fetched', { 
      count: paginatedVideos.length, 
      total: videos.length,
      filters: { category, model, search, featured, sort }
    })

    return NextResponse.json({
      success: true,
      videos: paginatedVideos, // Full data including videoUrl
      total: videos.length,
      totalPages: Math.ceil(videos.length / limit),
      pagination: {
        page,
        limit,
        offset,
        total: videos.length,
        totalPages: Math.ceil(videos.length / limit)
      }
    })
  } catch (error) {
    safeError('Error fetching admin videos', error)
    return NextResponse.json({ error: 'Failed to fetch admin videos' }, { status: 500 })
  }
}

// POST /api/admin/videos - Create video (admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const token = request.headers.get('authorization')
    // if (!isValidAdminToken(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const video = await request.json()
    const newVideo = await dbService.createVideo(video)
    
    safeLog('🔐 Admin video created', { id: newVideo.id, title: newVideo.title })
    return NextResponse.json(newVideo, { status: 201 })
  } catch (error) {
    safeError('Error creating admin video', error)
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}
