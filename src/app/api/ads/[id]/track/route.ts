import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

// POST /api/ads/[id]/track - Track ad impression or click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { type } = await request.json() // 'impression' or 'click'
    
    if (!type || !['impression', 'click'].includes(type)) {
      return NextResponse.json({ error: 'Invalid tracking type' }, { status: 400 })
    }

    const field = type === 'impression' ? 'impressionCount' : 'clickCount'
    const updateAd = dbService.db.prepare(`
      UPDATE ads 
      SET ${field} = ${field} + 1, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = updateAd.run(id)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    return NextResponse.json({ message: `${type} tracked successfully` })
  } catch (error) {
    console.error('Error tracking ad:', error)
    return NextResponse.json({ error: 'Failed to track ad' }, { status: 500 })
  }
}
