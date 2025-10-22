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
    const model = await dbService.getModelById(id)
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    
    return NextResponse.json(model)
  } catch (error) {
    console.error('Error fetching model:', error)
    return NextResponse.json({ error: 'Failed to fetch model' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const updates = await request.json()
    
    const updatedModel = await dbService.updateModel(id, updates)
    
    if (!updatedModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedModel)
  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const success = await dbService.deleteModel(id)
    
    if (!success) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Model deleted successfully' })
  } catch (error) {
    console.error('Error deleting model:', error)
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
  }
}
