import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'

interface UpdateContentRequest {
  title?: string
  description?: string
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const videoId = parseInt(id)
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const body: UpdateContentRequest = await request.json()
    const { title, description } = body

    if (!title && !description) {
      return NextResponse.json({ 
        error: 'At least one field (title or description) is required' 
      }, { status: 400 })
    }

    // Get current video data
    const currentVideo = await dbService.getVideoById(videoId)
    if (!currentVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (title) updateData.title = title
    if (description) updateData.description = description

    // Update video in database
    await dbService.updateVideo(videoId, updateData)

    safeLog('📝 Video content updated', { 
      videoId, 
      updatedFields: Object.keys(updateData),
      newTitle: title?.substring(0, 50) + '...',
      newDescription: description?.substring(0, 100) + '...'
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Video content updated successfully',
      updatedFields: Object.keys(updateData)
    })

  } catch (error) {
    safeError('Error updating video content', error)
    return NextResponse.json({ 
      error: 'Failed to update video content' 
    }, { status: 500 })
  }
}
