import { NextResponse } from 'next/server'
import dbService from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'

// GET /api/video/[id]/stream - Get video stream URL (protected)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const videoId = parseInt(id)
    
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Get video with full data
    const video = await dbService.getVideoById(videoId)
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // TODO: Add rate limiting and access control here
    // - Check if user has access to this video
    // - Implement view tracking
    // - Add referrer validation

    safeLog('🎬 Video stream requested', { 
      id: videoId, 
      title: video.title,
      type: video.videoUrlType || 'unknown'
    })

    // Return only the necessary streaming data
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        videoUrl: video.videoUrl,
        videoUrlType: video.videoUrlType,
        thumbnail: video.thumbnail,
        duration: video.duration
      }
    })
  } catch (error) {
    safeError('Error fetching video stream', error)
    return NextResponse.json({ error: 'Failed to fetch video stream' }, { status: 500 })
  }
}
