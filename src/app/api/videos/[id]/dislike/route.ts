import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const videoId = parseInt(idParam)

    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Get current video
    const video = await dbService.getVideoById(videoId)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Increment dislikes
    const updatedVideo = await dbService.updateVideo(videoId, {
      ...video,
      dislikes: video.dislikes + 1
    })

    return NextResponse.json({ 
      success: true, 
      dislikes: updatedVideo?.dislikes || video.dislikes + 1
    })
  } catch (error) {
    console.error('Error disliking video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
