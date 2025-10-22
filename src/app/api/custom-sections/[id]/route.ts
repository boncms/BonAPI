import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const sectionData = await request.json()
    
    const updatedSection = await dbService.updateCustomSection(id, sectionData)
    if (!updatedSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedSection)
  } catch (error) {
    console.error('Error updating custom section:', error)
    return NextResponse.json({ error: 'Failed to update custom section' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    const deleted = await dbService.deleteCustomSection(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Section deleted successfully' })
  } catch (error) {
    console.error('Error deleting custom section:', error)
    return NextResponse.json({ error: 'Failed to delete custom section' }, { status: 500 })
  }
}
