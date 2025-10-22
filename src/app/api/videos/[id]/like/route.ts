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

    // Increment likes
    const updatedVideo = await dbService.updateVideo(videoId, {
      ...video,
      likes: video.likes + 1
    })

    if (!updatedVideo) {
      return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      likes: updatedVideo.likes 
    })
  } catch (error) {
    console.error('Error liking video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
