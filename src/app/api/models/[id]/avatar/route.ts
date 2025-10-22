import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    // Get model by ID
    const model = await dbService.getModelById(id)
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // If model already has avatar, return it
    if (model.avatar && model.avatar.trim() !== '') {
      return NextResponse.json({ 
        success: true, 
        avatar: model.avatar,
        source: 'existing'
      })
    }

    // Get first video of this model
    const videos = await dbService.getVideosByModel(model.name)
    if (videos.length === 0) {
      return NextResponse.json({ 
        success: true, 
        avatar: null,
        source: 'no_videos'
      })
    }

    // Get thumbnail from first video
    const firstVideo = videos[0]
    if (!firstVideo.thumbnail || firstVideo.thumbnail.trim() === '') {
      return NextResponse.json({ 
        success: true, 
        avatar: null,
        source: 'no_thumbnail'
      })
    }

    // Update model with new avatar
    await dbService.updateModel(id, { avatar: firstVideo.thumbnail })

    return NextResponse.json({ 
      success: true, 
      avatar: firstVideo.thumbnail,
      source: 'video_thumbnail'
    })
  } catch (error) {
    console.error('Error getting model avatar:', error)
    return NextResponse.json({ error: 'Failed to get model avatar' }, { status: 500 })
  }
}
