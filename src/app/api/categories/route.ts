import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    const result = await dbService.getCategoriesPaginated(limit, offset, search)
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const category = await request.json()
    
    // Validate required fields
    if (!category.name || category.name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    
    const categoryName = category.name.trim()
    
    // Check if category already exists
    const existingCategory = await dbService.getCategoryByName(categoryName)
    if (existingCategory) {
      // Return existing category instead of creating new one
      return NextResponse.json(existingCategory, { status: 200 })
    }
    
    // Create new category only if it doesn't exist
    const newCategory = await dbService.createCategory({
      name: categoryName,
      description: category.description || '',
      videoCount: category.videoCount || 0
    })
    
    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
