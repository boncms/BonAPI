import { NextResponse } from 'next/server'
import dbService from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'

// GET /api/videos/slug/[slug] - Get video by slug (public, no videoUrl)
export async function GET(
  _request: Request,
  context: any
) {
  try {
    const { slug } = await context.params as { slug: string }
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    
    const video = await dbService.getVideoBySlug(slug)
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    
    // Filter out sensitive data for public API
    const { videoUrl, videoUrlType, ...safeVideo } = video
    
    safeLog('🎬 Video detail fetched by slug', { id: video.id, title: video.title })
    return NextResponse.json({ success: true, video: safeVideo })
  } catch (error) {
    safeError('Error fetching video by slug', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}
