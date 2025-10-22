import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    
    const sections = await dbService.getCustomSections(activeOnly)
    
    return NextResponse.json({
      success: true,
      sections
    })
  } catch (error) {
    console.error('Error fetching custom sections:', error)
    return NextResponse.json({ error: 'Failed to fetch custom sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sectionData = await request.json()
    
    // Validate required fields
    if (!sectionData.name || !sectionData.category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }
    
    const newSection = await dbService.createCustomSection(sectionData)
    return NextResponse.json(newSection, { status: 201 })
  } catch (error) {
    console.error('Error creating custom section:', error)
    return NextResponse.json({ error: 'Failed to create custom section' }, { status: 500 })
  }
}
