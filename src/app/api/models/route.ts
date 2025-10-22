import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'
import { createApiResponse, createErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'alphabetical'

    const result = await dbService.getModelsPaginated(limit, offset, search, sortBy)
    return createApiResponse({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return createErrorResponse('Failed to fetch models', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const model = await request.json()
    
    // Validate required fields
    if (!model.name || model.name.trim() === '') {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    }
    
    const modelName = model.name.trim()
    
    // Check if model already exists
    const existingModel = await dbService.getModelByName(modelName)
    if (existingModel) {
      // Return existing model instead of creating new one
      return NextResponse.json(existingModel, { status: 200 })
    }
    
    // Create new model only if it doesn't exist
    const newModel = await dbService.createModel({
      name: modelName,
      description: model.description || '',
      avatar: model.avatar || '',
      videoCount: model.videoCount || 0,
      totalViews: model.totalViews || 0
    })
    
    return NextResponse.json(newModel, { status: 201 })
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
  }
}
