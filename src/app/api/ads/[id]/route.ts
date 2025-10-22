import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET /api/ads/[id] - Get specific ad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ad = dbService.db.prepare('SELECT * FROM ads WHERE id = ?').get(id)
    
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    return NextResponse.json(ad)
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json({ error: 'Failed to fetch ad' }, { status: 500 })
  }
}

// PUT /api/ads/[id] - Update ad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adData = await request.json()
    
    const {
      title,
      description,
      content,
      css,
      js,
      position,
      isActive,
      startDate,
      endDate
    } = adData

    const updateAd = dbService.db.prepare(`
      UPDATE ads 
      SET title = ?, description = ?, content = ?, css = ?, js = ?, 
          position = ?, isActive = ?, startDate = ?, endDate = ?, 
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = updateAd.run(
      title,
      description || null,
      content,
      css || null,
      js || null,
      position,
      isActive ? 1 : 0,
      startDate || null,
      endDate || null,
      id
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    const updatedAd = dbService.db.prepare('SELECT * FROM ads WHERE id = ?').get(id)
    return NextResponse.json(updatedAd)
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 })
  }
}

// DELETE /api/ads/[id] - Delete ad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleteAd = dbService.db.prepare('DELETE FROM ads WHERE id = ?')
    const result = deleteAd.run(id)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Ad deleted successfully' })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}
