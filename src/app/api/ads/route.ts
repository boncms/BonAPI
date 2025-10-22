import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET /api/ads - Get all ads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')
    const active = searchParams.get('active')

    let query = 'SELECT * FROM ads'
    const params: any[] = []
    const conditions: string[] = []

    if (position) {
      conditions.push('position = ?')
      params.push(position)
    }

    if (active !== null) {
      conditions.push('isActive = ?')
      params.push(active === 'true' ? 1 : 0)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY createdAt DESC'

    const ads = dbService.db.prepare(query).all(...params)
    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}

// POST /api/ads - Create new ad
export async function POST(request: NextRequest) {
  try {
    const adData = await request.json()
    
    const {
      title,
      description,
      content,
      css,
      js,
      position,
      isActive = true,
      startDate,
      endDate
    } = adData

    if (!title || !content || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const insertAd = dbService.db.prepare(`
      INSERT INTO ads (title, description, content, css, js, position, isActive, startDate, endDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertAd.run(
      title,
      description || null,
      content,
      css || null,
      js || null,
      position,
      isActive ? 1 : 0,
      startDate || null,
      endDate || null
    )

    const newAd = dbService.db.prepare('SELECT * FROM ads WHERE id = ?').get(result.lastInsertRowid)
    return NextResponse.json(newAd, { status: 201 })
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}
